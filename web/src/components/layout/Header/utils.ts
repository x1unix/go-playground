import type { ICommandBarData } from '@fluentui/react'

const MIN_PRIMARY_ITEMS_COUNT = 2

const getItemResizeKey = (item: { key: string | number; cacheKey?: string; iconOnly?: boolean }) => {
  const itemKey = item.cacheKey ?? item.key
  return `${String(itemKey)}:${item.iconOnly ? 'icon' : 'text'}`
}

const getDataCacheKey = (data: ICommandBarData) => {
  const primaryKey = data.primaryItems.map(getItemResizeKey).join('|')
  const overflowKey = data.overflowItems.map((item) => String(item.cacheKey ?? item.key)).join('|')
  const farKey = data.farItems?.map((item) => String(item.cacheKey ?? item.key)).join('|') ?? ''

  return `${primaryKey}::${overflowKey}::${farKey}`
}

export const handleBarShrink = (data: ICommandBarData): ICommandBarData | undefined => {
  if (data.primaryItems.length > MIN_PRIMARY_ITEMS_COUNT) {
    const nextPrimaryItems = data.primaryItems.slice(0, MIN_PRIMARY_ITEMS_COUNT)
    const movedOverflowItems = data.primaryItems.slice(MIN_PRIMARY_ITEMS_COUNT).map((item) => ({
      ...item,
      renderedInOverflow: true,
    }))

    const nextData = {
      ...data,
      primaryItems: nextPrimaryItems,
      overflowItems: [...movedOverflowItems, ...data.overflowItems],
    }

    return {
      ...nextData,
      cacheKey: getDataCacheKey(nextData),
    }
  }

  if (data.primaryItems.some((item) => !item.iconOnly)) {
    const nextData = {
      ...data,
      primaryItems: data.primaryItems.map((item) => ({
        ...item,
        iconOnly: true,
      })),
    }

    return {
      ...nextData,
      cacheKey: getDataCacheKey(nextData),
    }
  }

  return undefined
}

export const handleBarGrow = (data: ICommandBarData): ICommandBarData | undefined => {
  if (data.primaryItems.some((item) => item.iconOnly)) {
    const nextData = {
      ...data,
      primaryItems: data.primaryItems.map(({ iconOnly, ...item }) => item),
    }

    return {
      ...nextData,
      cacheKey: getDataCacheKey(nextData),
    }
  }

  const movedItemsCount = data.overflowItems.length - data.minimumOverflowItems
  if (movedItemsCount > 0) {
    const movedItems = data.overflowItems.slice(0, movedItemsCount).map((item) => ({
      ...item,
      renderedInOverflow: false,
    }))

    const nextData = {
      ...data,
      primaryItems: [...data.primaryItems, ...movedItems],
      overflowItems: data.overflowItems.slice(movedItemsCount),
    }

    return {
      ...nextData,
      cacheKey: getDataCacheKey(nextData),
    }
  }

  return undefined
}
