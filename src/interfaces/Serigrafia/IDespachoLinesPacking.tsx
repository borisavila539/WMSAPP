export interface IDespachoLinesPacking {
  id: number
  despachoId?: number | null
  prodMasterId?: string | null
  prodId?: string | null
  itemId?: string | null
  box?: number | null
  size?: string | null
  colorId?: string | null
  qty?: number | null
  packing?: boolean | null
  userPacking?: string | null
  packingDateTime?: Date | null
  receive?: boolean | null
  userReceive?: string | null
  receiveDateTime?: Date | null
  boxCategoryId?: number | null
}