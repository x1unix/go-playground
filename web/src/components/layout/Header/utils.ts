import { ContextualMenuItemType, type IContextualMenuItem, type IIconProps } from '@fluentui/react'
import snippets, { type Snippet, SnippetType } from '~/services/go/snippets'

const snippetIconTypeMapping: Record<string, IIconProps> = {
  [SnippetType.Test]: {
    iconName: 'TestPlan',
  },
  [SnippetType.Experimental]: {
    iconName: 'ATPLogo',
  },
}

export interface SnippetMenuItem extends Snippet {}

/**
 * Returns snippets list dropdown menu items
 * @param handler menu item click handler
 */
export const getSnippetsMenuItems = (handler: (s: SnippetMenuItem) => void) => {
  const menuItems: IContextualMenuItem[] = []
  Object.entries(snippets).forEach((s, i) => {
    // this can be done in with ".map().reduce()"
    // but imho simple imperative method will look
    // more readable in future
    const [sectionName, items] = s

    const section = {
      key: i.toString(),
      text: sectionName,
      itemType: ContextualMenuItemType.Header,
    }

    const sectionItems = items.map((item, ii) => {
      return {
        key: `${i}-${ii}`,
        text: item.label,
        iconProps: item.icon ? { iconName: item.icon } : getSnippetIconProps(item.type),
        onClick: () => {
          handler(item)
        },
      } as IContextualMenuItem
    })

    menuItems.push(...[section, ...sectionItems])
  })
  return menuItems
}

const getSnippetIconProps = (snippetType?: SnippetType): IIconProps | undefined => {
  if (snippetType == null) return
  if (!(snippetType in snippetIconTypeMapping)) return
  return snippetIconTypeMapping[snippetType]
}
