# Plano de Implementação: Consolidar Pallets

## 1. Atualização do Banco de Dados (Supabase)
Precisaremos adicionar três novos campos na tabela `inventory` para suportar o agrupamento de pallets sem quebrar a estrutura existente. Fornecerei um script SQL para ser executado no SQL Editor do Supabase:
- `is_group` (BOOLEAN): Indica se o registro é um Pallet Consolidado.
- `parent_group_id` (TEXT): Relaciona um pallet interno ao seu grupo consolidador.
- `hidden` (BOOLEAN): Oculta os pallets originais das listagens normais (Estoque Geral) para evitar contagem duplicada.

## 2. Tipos e Interfaces (`types.ts`)
- Atualizar a interface `SheetRow` adicionando as propriedades `is_group`, `parent_group_id`, e `hidden`.
- Adicionar os tipos de histórico `CONSOLIDATE_GROUP` e `UNCONSOLIDATE_GROUP` no `HistoryType`.

## 3. Serviços e Consultas (`services/supabaseService.ts`)
- **Modificar Consultas Atuais**: Ajustar funções como `getInventoryPaginated`, `getPendingInventory`, `getGlobalStats` e `getShipmentPalletCounts` para ignorar pallets onde `hidden = true`.
- **Novas Funções**:
  - `consolidatePallets(parentData, childIds, slotId)`: Cria o registro consolidado, oculta os pallets originais vinculando-os ao novo ID e atualiza a vaga.
  - `unconsolidatePallets(groupId)`: Deleta (ou inativa) o pallet consolidado, desoculta os originais e remove o vínculo `parent_group_id`. Os originais passarão a ter o status de "Aguardando Vaga".

## 4. Nova Tela/Modal de Consolidação (`components/ConsolidateModal.tsx`)
- Um novo modal que exibirá a lista de pallets selecionados.
- Fará a **validação estrita**: garantirá que os pallets tenham o mesmo produto (descrição), mesmo tipo de insumo e mesmo depósito (e alertará/impedirá caso sejam diferentes).
- Permitirá selecionar a vaga de destino para o novo pallet consolidado (incluindo "Aguardando Vaga").

## 5. Interface e Componentes Visuais
- **Página de Estoque (`App.tsx`)**: Adicionar o botão "Consolidar Pallets" na barra de ações em lote. Esse botão só aparecerá se mais de 1 pallet estiver selecionado.
- **Card do Pallet (`components/InventoryCard.tsx`)**: Inserir um identificador visual (ex: `🔗 CONSOLIDADO (x3)`) nos pallets que forem do tipo grupo, mantendo a identidade visual atual.
- **Detalhes do Pallet (`components/InventoryDetailModal.tsx`)**:
  - Ao abrir um pallet consolidado, exibir uma aba ou seção listando os pallets internos e as quantidades.
  - Exibir as quantidades somadas no total.
  - Inserir o botão "Desfazer Consolidação" na aba de ações/detalhes.

## 6. Pesquisa e Compatibilidade
- **Busca**: A busca global pelo lote ou OP de um pallet oculto retornará o pallet pai consolidado, garantindo que o usuário consiga localizar a mercadoria agrupada.
- **Movimentações**: O pallet consolidado terá comportamento padrão no mapa e histórico. Transferi-lo de vaga moverá logicamente todos os itens contidos nele.

## 7. Histórico
- Toda ação de consolidar e desconsolidar será registrada na tabela `history`, identificando o usuário, a data e quais pallets foram afetados.

