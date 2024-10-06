import clsx from 'clsx'
import React from 'react'
import { Link, mergeStyles } from '@fluentui/react'

import changelog from '~/changelog.json'
import environment from '~/environment'

interface Props extends Pick<React.HTMLProps<HTMLDivElement>, 'className' | 'style'> {}

const listStyles = mergeStyles({
  paddingLeft: '1rem',
})

export const ChangeLog: React.FC<Props> = ({ className, ...props }) => {
  return (
    <div className={clsx('ChangeLog', className)} {...props}>
      {Object.entries(changelog).map(([section, items]) => (
        <div key={section}>
          <b>{section}</b>
          <ul className={listStyles}>
            {items.map(({ issueId, url, description }) => (
              <li key={issueId}>
                <Link href={`${environment.urls.github}/${url}`} target="_blank">
                  #{issueId}
                </Link>
                <span> - {description}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <p>
        <span>Full release notes are available </span>
        <Link href={`${environment.urls.github}/releases/tag/v${environment.appVersion}`} target="_blank">
          here
        </Link>
      </p>
    </div>
  )
}
