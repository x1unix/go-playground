import type * as monaco from 'monaco-editor'
import type { StateDispatch } from '~/store'
import { newAddNotificationAction, newRemoveNotificationAction, NotificationType } from '~/store/notifications'
import type { LanguageWorker } from '~/workers/language'
import type { DocumentMetadataCache } from './cache'

const notificationId = 'GoImportsListLoad'
const emptySuggestions = { suggestions: [] }

/**
 * Base class to implement providers which query completions from cache.
 *
 * Implements routine logic of displaying preloader if cache is not ready, error handling and etc.
 */
export abstract class CacheBasedCompletionProvider<TQuery> implements monaco.languages.CompletionItemProvider {
  protected isWarmUp = false

  /**
   * @param dispatch Redux state dispatcher. Used to push notifications.
   * @param metadataCache Document metadata cache.
   * @param langWorker Go completion worker.
   */
  constructor(
    protected readonly dispatch: StateDispatch,
    protected readonly metadataCache: DocumentMetadataCache,
    protected langWorker: LanguageWorker,
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

  private async isCacheReady() {
    if (this.isWarmUp) {
      return true
    }

    return await this.langWorker.isWarmUp()
  }

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

    const isCacheReady = await this.isCacheReady()
    try {
      if (!isCacheReady) {
        this.showLoadingProgress()
      }

      const suggestions = await this.querySuggestions(query)

      if (!isCacheReady) {
        this.isWarmUp = true
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
