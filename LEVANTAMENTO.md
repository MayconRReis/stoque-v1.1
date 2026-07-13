# Levantamento de Consultas `inventory` (Etapa 2)

Abaixo está a análise de todas as funções do `supabaseService.ts` que consultam a tabela `inventory` e como a regra de consolidação (`parent_group_id IS NULL`) será aplicada.

**Estratégia Principal:** Criar um método auxiliar (ex: `filterRootPallets(query)`) para injetar `.is('parent_group_id', null)` onde for necessário, evitando duplicação.

### 1. Telas de Listagem (Ocultar Filhos)
Estas funções populam telas e relatórios de estoque. Se mostrarmos os filhos, haverá contagem e listagem duplicada da mesma mercadoria (já que o pallet consolidado agregará as quantidades e representará a mercadoria na tela).
- `getInventoryPaginated`: **Ocultar filhos**. (Tela de Estoque Geral).
- `getAllInventoryForExport`: **Ocultar filhos**. (Exportação Excel/CSV não deve duplicar o estoque).
- `getPendingInventory`: **Ocultar filhos**. (Tela Início / Aguardando Inspeção).
- `getWaitingInventory`: **Ocultar filhos**. (Tela de Aguardando Vaga).

### 2. Estatísticas e Diagnósticos (Ocultar Filhos)
Estas funções calculam ocupação e inconsistências. Filhos não ocupam vagas reais (apenas através do seu agrupamento) e não devem entrar na contagem de diagnóstico, senão gerarão "falsos positivos" de vaga fantasma/conflito.
- `getGlobalStats`: **Ocultar filhos**. (A soma de frascos/insumos já estará no pallet pai).
- `getShipmentPalletCounts`: **Ocultar filhos**.
- `getWarehouseDiagnostic`: **Ocultar filhos**.
- `cleanupGhostPallets`: **Ocultar filhos**.
- `findPalletsBySlot`: **Ocultar filhos**. (Ao clicar na vaga no mapa, mostra o pai que representa a ocupação real).

### 3. Consultas Específicas / Por ID (Considerar Ambos)
Estas funções precisam encontrar **qualquer** pallet, independentemente de ser um grupo, um filho oculto ou um pallet comum. Elas são usadas para detalhes, pesquisas diretas via bipe, relacionamentos ou histórico.
- `getInventoryItemById`: **Considerar ambos**.
- `getInventoryItemByLoadingId`: **Considerar ambos**.
- `findPalletByLoadingId`: **Considerar ambos**.
- `getInventoryItemsByIds`: **Considerar ambos**.
- `getInventoryItemsByShipmentId`: **Considerar ambos**.
- `getHistoryPaginated` (enriquecimento de dados): **Considerar ambos**.
- `searchInventory` / `searchInventoryByFilters` (busca rotativa/específica): **Considerar ambos** (Para que a busca global e bipes funcionem em pallets filhos e consigam encontrar o grupo através deles).

---
**Como as alterações serão aplicadas?**
Vou criar uma constante/helper no próprio arquivo:
```typescript
const filterRootPallets = (query: any) => query.is('parent_group_id', null);
```
Nas funções que requerem ocultação, substituirei chamadas como:
```typescript
let query = supabase.from('inventory').select('*');
```
Por:
```typescript
let query = filterRootPallets(supabase.from('inventory').select('*'));
```

Aguardo sua validação sobre esse levantamento. Se concordar, prosseguirei com as modificações no `supabaseService.ts`.
