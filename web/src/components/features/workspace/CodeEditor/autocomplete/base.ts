import type * as monaco from 'monaco-editor'
import type { GoCompletionService } from '~/services/completion'
import type { StateDispatch } from '~/store'
import { newAddNotificationAction, newRemoveNotificationAction, NotificationType } from '~/store/notifications'

const notificationId = 'GoImportsListLoad'
const emptySuggestions = { suggestions: [] }

/**
 * Base class to implement providers which query completions from cache.
 *
 * Implements routine logic of displaying preloader if cache is not ready, error handling and etc.
 */
export abstract class CacheBasedCompletionProvider<TQuery> implements monaco.languages.CompletionItemProvider {
  /**
   * @param dispatch Redux state dispatcher. Used to push notifications.
   * @param cache Go completion cache service.
   */
  constructor(
    protected readonly dispatch: StateDispatch,
    protected cache: GoCompletionService,
  ) {}

  /**
   * List of default fallback suggestions returned on error.
   */
  protected getFallbackSuggestions(_query: TQuery): monaco.languages.CompletionList {
    return emptySuggestions
  }

  /**
   * Method to implement logic of fetching completion items.
   */
  protected abstract querySuggestions(query: TQuery): Promise<monaco.languages.CompletionItem[]>

  /**
   * Method to extract completion query from document.
   *
   * Falsy value indicates that selection doesn't contain any valid values.
   * Returned non-null result will be passed to `getCachedSuggestions`.
   * @see `monaco.languages.CompletionItemProvider.provideCompletionItems`
   */
  protected abstract parseCompletionQuery(
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    context: monaco.languages.CompletionContext,
    token: monaco.CancellationToken,
  ): TQuery | null

  async provideCompletionItems(
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    context: monaco.languages.CompletionContext,
    token: monaco.CancellationToken,
  ): Promise<monaco.languages.CompletionList> {
    const query = this.parseCompletionQuery(model, position, context, token)
    if (!query) {
      return emptySuggestions
    }

    const shouldDisplayPreload = !this.cache.isWarmUp()
    try {
      if (shouldDisplayPreload) {
        this.showLoadingProgress()
      }

      const suggestions = await this.querySuggestions(query)

      if (shouldDisplayPreload) {
        this.dispatch(newRemoveNotificationAction(notificationId))
      }

      return { suggestions }
    } catch (err) {
      console.error(err)
      this.showErrorMessage(err)
      return this.getFallbackSuggestions(query)
    }
  }

  private showLoadingProgress() {
    this.dispatch(
      newAddNotificationAction({
        id: notificationId,
        type: NotificationType.None,
        title: 'Go Packages Index',
        description: 'Downloading Go packages index...',
        canDismiss: false,
        progress: {
          indeterminate: true,
        },
      }),
    )
  }

  private showErrorMessage(err: any) {
    this.dispatch(
      newAddNotificationAction({
        id: notificationId,
        type: NotificationType.Error,
        title: 'Failed to download Go package index',
        description: 'message' in err ? err.message : `${err}`,
        canDismiss: true,
      }),
    )
  }
}
