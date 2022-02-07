import snippets, {Snippet, SnippetType} from '../services/go/snippets';
import {ContextualMenuItemType, IContextualMenuItem, IIconProps} from '@fluentui/react';

const snippetIconTypeMapping: {[type: string]: IIconProps} = {
    [SnippetType.Test]: {
        iconName: 'TestPlan'
    }
}

export interface SnippetMenuItem extends Snippet {}

/**
 * Returns snippets list dropdown menu items
 * @param handler menu item click handler
 */
export const getSnippetsMenuItems = (handler: (s: SnippetMenuItem) => void) => {
    let menuItems: IContextualMenuItem[] = [];
    Object.entries(snippets).forEach((s, i) => {
        // this can be done in with ".map().reduce()"
        // but imho simple imperative method will look
        // more readable in future
        const [sectionName, items] = s;

        const section = {
            key: i.toString(),
            text: sectionName,
            itemType: ContextualMenuItemType.Header
        };

        const sectionItems = items.map((item, ii) => {
            return {
                key: `${i}-${ii}`,
                text: item.label,
                iconProps: getSnippetIconProps(item.type),
                onClick: () => handler(item)
            } as IContextualMenuItem;
        })

        menuItems.push(...[section, ...sectionItems]);
    })
    return menuItems;
};

const getSnippetIconProps = (snippetType?: SnippetType): IIconProps|undefined => {
    if (!snippetType) return;
    if (!(snippetType in snippetIconTypeMapping)) return;
    return snippetIconTypeMapping[snippetType];
}
