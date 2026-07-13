# Plano Revisado de Implementação: Consolidar Pallets

## 1. Atualização do Banco de Dados (Supabase)
Conforme análise do schema atual da tabela `inventory`, o campo `id` é do tipo `TEXT`. A modelagem seguirá a lógica de relacionamento sem uso de campo `hidden`.

**Migration SQL:**
```sql
ALTER TABLE inventory 
ADD COLUMN is_group BOOLEAN DEFAULT false,
ADD COLUMN parent_group_id TEXT REFERENCES inventory(id) ON DELETE SET NULL;
```
*Não será necessário campo `hidden`. A lógica de ocultação de pallets agrupados será baseada na condição `parent_group_id IS NULL`.*

## 2. Tipos e Interfaces (`types.ts`)
- Adicionar `is_group?: boolean` e `parent_group_id?: string` na interface `SheetRow`.
- Adicionar tipo de status `CANCELLED` no `StockStatus` (para marcar grupos desfeitos preservando o histórico).
- Adicionar `CONSOLIDATE_GROUP` e `UNCONSOLIDATE_GROUP` no `HistoryType`.

## 3. Serviços e Consultas (`services/supabaseService.ts`)
- **Modificar Consultas Atuais (`getInventoryPaginated`, `getPendingInventory`, `getGlobalStats`, `getShipmentPalletCounts`)**:
  - Ajustar todas as buscas da tabela `inventory` para incluir a cláusula `.is('parent_group_id', null)` nas consultas gerais, garantindo que os pallets "filhos" não apareçam soltos listagens padrão ou nas contagens de vagas.
- **Novas Funções**:
  - `consolidatePallets(childItems, slotId, userId, userName)`: 
    - Cria o novo registro consolidado em `inventory` com `is_group = true`.
    - As quantidades (frascos, caixas, etc.) e propriedades no `inspections` do grupo serão a soma das quantidades e dados dos filhos.
    - Atualiza os pallets originais (`childItems`) definindo o `parent_group_id` igual ao ID do novo grupo, e altera a vaga deles internamente para algo como `AGUARDANDO` ou mantém a referência do grupo.
    - Grava no histórico a criação do grupo.
  - `unconsolidatePallets(groupItem, childItems, userId, userName)`: 
    - Marca o pallet consolidado (o grupo) com `status = 'CANCELLED'`. Ele não é excluído.
    - Atualiza os pallets filhos: limpa o `parent_group_id` (para voltarem a aparecer livres) e define a vaga deles como "AGUARDANDO".
    - Grava o histórico do desfazimento.

## 4. Nova Tela/Modal de Consolidação (`components/ConsolidateModal.tsx`)
- Modal listando os pallets pré-selecionados.
- **Validações estritas na abertura e confirmação**:
  - Verifica se todos têm a mesma `description` (Produto).
  - Verifica se todos têm a mesma `originOP`.
  - Verifica se todos têm o mesmo tipo (`contentType`).
  - Impede se algum pallet já estiver em um grupo (`parent_group_id != null`).
  - Impede se algum pallet for ele próprio um grupo (`is_group == true`).
  - (Opcional/Configurável: validação de mesmo Lote).

## 5. Interface e Componentes Visuais
- **Página de Estoque (`App.tsx`)**: Botão "Consolidar Pallets" na barra flutuante ao selecionar >1 pallet válido.
- **Card do Pallet (`components/InventoryCard.tsx`)**: Se `is_group` for true, adiciona uma tag visual `🔗 CONSOLIDADO (xN)` onde N é o número de filhos (que carregaremos no objeto ou contaremos). O layout geral e as cores são mantidos idênticos.
- **Detalhes do Pallet (`components/InventoryDetailModal.tsx`)**:
  - Ao visualizar um pallet grupo, adicionar uma lista/acordeão dos "Pallets Vinculados".
  - Botão "Desfazer Consolidação" na interface.

## 6. Pesquisa e Busca Global
- A query de busca (ex: `searchTerm`) será modificada (ou o endpoint de busca) para também olhar os filhos. Se o usuário buscar por um pallet que possui `parent_group_id`, a API e a UI poderão carregar/retornar o grupo pai para que o usuário saiba onde a mercadoria se encontra.

## Como proceder
Aguardo a sua validação deste plano revisado. Se estiver de acordo, avançarei para a **Etapa 1** (Atualizar Tipos e executar a Migration do Supabase).
