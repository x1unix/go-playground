import type { ICommandBarData } from '@fluentui/react'

const MIN_PRIMARY_ITEMS_COUNT = 3

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
    const movedItem = data.primaryItems[data.primaryItems.length - 1]
    if (!movedItem) {
      return undefined
    }

    const nextData = {
      ...data,
      primaryItems: data.primaryItems.slice(0, -1),
      overflowItems: [
        {
          ...movedItem,
          renderedInOverflow: true,
        },
        ...data.overflowItems,
      ],
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
    const movedItem = data.overflowItems[0]
    if (!movedItem) {
      return undefined
    }

    const nextData = {
      ...data,
      primaryItems: [
        ...data.primaryItems,
        {
          ...movedItem,
          renderedInOverflow: false,
        },
      ],
      overflowItems: data.overflowItems.slice(1),
    }

    return {
      ...nextData,
      cacheKey: getDataCacheKey(nextData),
    }
  }

  return undefined
}
