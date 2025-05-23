import apiClient from '../api'
import config from '../config'
import { AnnouncementService } from './service'

const announcementService = new AnnouncementService(apiClient, config)

export default announcementService
export type * from './service'
