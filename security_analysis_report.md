# Relatório de Análise de Segurança e Arquitetura: Fluxo de Créditos IA

Este relatório detalha a análise profunda realizada nos componentes de backend (`codigoCreditoService.js`) e frontend (`creditosiaController.js`) responsáveis pelo novo fluxo de resgate e criação de códigos de crédito de IA. 

A análise foi conduzida com foco em vulnerabilidades de segurança (OWASP Top 10), resiliência do sistema (concorrência e atomicidade) e boas práticas de desenvolvimento.

---

## 1. Vulnerabilidades Críticas (Prioridade Alta)

### 1.1 Injeção NoSQL (NoSQL Injection)
**Local:** Backend (`codigoCreditoService.js` - Linhas 23, 34)
**Descrição:** O código recebe o campo `codigo` diretamente de `req.body` e o repassa para a query `CodigoCredito.findOne({ codigo })`. Se um atacante enviar um objeto JSON malicioso em vez de uma string, como `{"codigo": {"$ne": null}}` ou `{"codigo": {"$regex": "^A"}}`, a query retornará o primeiro código de crédito encontrado no banco de dados, permitindo que o atacante roube créditos aleatórios sem conhecer o código real.
**Solução Proposta:**
Garantir que o valor de `codigo` seja estritamente uma string antes de realizar a consulta no banco de dados.
```javascript
const { codigo } = req.body;
if (typeof codigo !== 'string' || codigo.trim() === '') {
  return res.status(400).json({ error: 'Código inválido.' });
}
```

### 1.2 Rota de Criação Desprotegida (Broken Access Control)
**Local:** Backend (`codigoCreditoService.js` - Função `criar`, Linhas 169-204)
**Descrição:** A função `criar` é descrita como "Rota aberta... sem autenticação". Isso é um risco de segurança crítico. Qualquer pessoa que descubra esse endpoint (por exemplo, inspecionando o código frontend ou fazendo brute-force de rotas) pode criar infinitos códigos de crédito válidos e injetá-los no sistema.
**Solução Proposta:**
1. Proteger a rota com middlewares de autenticação (ex: JWT) e autorização (somente usuários com role `admin` podem acessar).
2. Se a rota era apenas para testes temporários, ela deve ser removida imediatamente e substituída por scripts de "seed" no banco de dados.

### 1.3 IDOR (Insecure Direct Object Reference)
**Local:** Frontend (`creditosiaController.js` - Linhas 41, 43)
**Descrição:** O frontend constrói a URL de resgate enviando o `usuarioId` e `grupoeconomicoId` via Query String: `/creditos/resgatar?usuario=ID_AQUI`. Se o backend estiver lendo esses parâmetros da URL (via `req.query` ou middleware similar) para atribuir o resgate, um atacante pode facilmente alterar esse ID na requisição interceptada e roubar créditos para si usando a conta/limite de outra pessoa.
**Solução Proposta:**
**Backend:** Nunca confiar em IDs de usuário vindos do client para ações autenticadas. O usuário e o grupo econômico devem ser extraídos **exclusivamente do token de autenticação** da requisição (ex: `req.user`).
**Frontend:** Remover a passagem de parâmetros pela URL. A chamada deve ser apenas:
```javascript
var url = urls.apiUrl + '/creditos/resgatar';
```

---

## 2. Erros de Concorrência e Arquitetura (Prioridade Média/Alta)

### 2.1 Condição de Corrida (Race Condition / TOCTOU)
**Local:** Backend (`codigoCreditoService.js` - Função `resgatar`)
**Descrição:** O sistema verifica se o limite total foi atingido (`if (codigoCredito.quantidadeUtilizacoes >= codigoCredito.limiteTotal)`) na linha 51. Se 100 requisições simultâneas chegarem para um código com limite de 1 uso, todas passarão nessa verificação.
Apesar do incremento em si ser protegido na linha 100 (`findOneAndUpdate` com `$lt`), o registro de `ResgateCredito` (linha 83) é inserido **antes** desse update atômico. Isso cria registros fantasmas de resgate para as 99 requisições que falharem depois, disparando o "Rollback manual".
**Solução Proposta:** 
Inverter a ordem lógica ou usar Transações. O ideal é primeiro tentar "consumir" o código (fazer o update atômico). Somente se ele retornar sucesso, cria-se o registro de `ResgateCredito` e injetam-se os créditos.
*Ver Seção 4 para a sugestão de refatoração de fluxo.*

### 2.2 Anti-pattern de Rollback Manual
**Local:** Backend (`codigoCreditoService.js` - Linhas 108, 127, 138-148)
**Descrição:** O uso de `deleteOne` e `$inc: { quantidadeUtilizacoes: -1 }` para reverter operações no banco caso algo dê errado é perigoso. Se o servidor crashar ou a rede falhar exatamente no momento do rollback, o banco de dados ficará em um estado inconsistente (ex: código consumido mas crédito não adicionado ao usuário).
Adicionalmente, se o rollback do `ResgateCredito` falhar, o índice único bloqueará o usuário de tentar resgatar de novo.
**Solução Proposta:**
Implementar **Transações do MongoDB (Sessions)**. O MongoDB (a partir da v4.0) suporta transações ACID. Isso garante que a inserção do `ResgateCredito`, a atualização do `CodigoCredito` e a adição no saldo do usuário ocorram em um único bloco "Tudo ou Nada".

---

## 3. Vulnerabilidades Menores e Qualidade de Código (Prioridade Média/Baixa)

### 3.1 Falta de Validação de Input na Criação
**Local:** Backend (`codigoCreditoService.js` - Função `criar`)
**Descrição:** Não há validação de tipo para `creditos`. Alguém com acesso à rota pode criar códigos com `creditos: -5000` (possivelmente negativando a conta de alguém) ou passar strings/objetos maliciosos.
**Solução Proposta:** Implementar uma biblioteca de schema validation (como `Joi` ou `Yup`) para validar os payloads antes de processá-los.

### 3.2 Construção Insegura de Query String
**Local:** Frontend (`creditosiaController.js` - Linha 43)
**Descrição:** A concatenação manual de strings para URLs (`?usuario=' + usuarioId`) pode causar bugs e não faz o URL Encode correto de caracteres especiais (embora IDs de mongo sejam seguros).
**Solução Proposta:** Usar o objeto `params` nativo do `$http` do AngularJS:
```javascript
$http.post(urls.apiUrl + '/creditos/resgatar', payload, {
  params: { usuario: usuarioId, grupoeconomico: grupoeconomicoId }
})
```

### 3.3 Enumeração de Dados Sensíveis
**Local:** Backend (`codigoCreditoService.js` - Erros na função `resgatar`)
**Descrição:** Erros muito específicos ("Código inexistente", "Código inativo", "Código esgotado") permitem que um atacante automatize scripts para mapear quais códigos existem no sistema e monitorar seu status.
**Solução Proposta:** Use uma mensagem de erro genérica e única para falhas de validação iniciais, como: *"Código inválido, inativo ou esgotado."*

---

## 4. Proposta de Solução: Refatoração do Fluxo `resgatar`

Abaixo está o pseudocódigo/esboço de como a função `resgatar` deve ser estruturada utilizando Transações do Mongoose, mitigando problemas de concorrência e eliminando rollbacks manuais:

```javascript
const resgatar = async (req, res) => {
  const { codigo } = req.body;
  if (typeof codigo !== 'string' || !codigo.trim()) {
    return res.status(400).json({ error: 'Código inválido.' });
  }

  // OBRIGATÓRIO: Usuário vir do req.user (extraído do token) e não do req.body/query
  const usuarioId = req.user._id; 
  
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const codigoCredito = await CodigoCredito.findOne({ codigo }).session(session);
    // Verificações genéricas (Data, Status)...

    // Validação de limite por usuário no período
    // ...

    // 1. Atualização Atômica (com block de concorrência)
    const updateQuery = { _id: codigoCredito._id, status: 'ativo' };
    if (codigoCredito.limiteTotal) {
      updateQuery.quantidadeUtilizacoes = { $lt: codigoCredito.limiteTotal };
    }

    const updatedCodigo = await CodigoCredito.findOneAndUpdate(
      updateQuery,
      { $inc: { quantidadeUtilizacoes: 1 }, $set: { atualizadoEm: new Date() } },
      { new: true, session }
    );

    if (!updatedCodigo) {
      throw new Error('CÓDIGO_ESGOTADO');
    }

    // Se bateu no limite agora, marca como esgotado
    if (updatedCodigo.limiteTotal && updatedCodigo.quantidadeUtilizacoes >= updatedCodigo.limiteTotal) {
      await CodigoCredito.updateOne({ _id: updatedCodigo._id }, { status: 'esgotado' }, { session });
    }

    // 2. Cria registro de Resgate
    const novoResgate = new ResgateCredito({ ... });
    await novoResgate.save({ session });

    // 3. Adiciona Créditos ao Usuário
    // (A função addCredits também DEVE aceitar a session se fizer db.save!)
    const addCreditsResult = await addCredits(usuarioId, codigoCredito.creditos, `Resgate do código ${codigo}`, session);

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({ success: true, ... });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    // Tratamento de erros (ex: 11000 para duplicate key, erros customizados, etc)
    return res.status(400).json({ error: 'Erro ao processar resgate.' });
  }
}
```

## Próximos Passos
Por favor, revise o relatório completo acima. Se desejar que eu implemente todas essas correções de segurança no backend e no frontend, basta me confirmar e iniciarei as edições nos arquivos correspondentes.
