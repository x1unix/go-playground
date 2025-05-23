import type { AnnouncementMessage, IAPIClient } from '../api'
import type { IConfig } from '../config'

export class AnnouncementService {
  constructor(
    private readonly client: IAPIClient,
    private readonly config: IConfig,
  ) {}

  async getAnnouncement(): Promise<AnnouncementMessage | null> {
    try {
      const msg = await this.client.getAnnouncementMessage()
      if (!msg?.type) {
        return null
      }

      const { lastDismissedAnnouncement } = this.config
      if (lastDismissedAnnouncement && lastDismissedAnnouncement === msg.key) {
        return null
      }

      return msg
    } catch (err) {
      console.error('failed to get announcement banner:', err)
      return null
    }
  }

  dismissAnnouncement(announcementKey: string) {
    this.config.lastDismissedAnnouncement = announcementKey
  }
}
