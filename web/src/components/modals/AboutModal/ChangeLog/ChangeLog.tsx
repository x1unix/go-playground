import clsx from 'clsx'
import React from 'react'
import { Link } from '@fluentui/react/lib/Link'

import changelog from '~/changelog.json'
import environment from '~/environment'

interface Props extends Pick<React.HTMLProps<HTMLDivElement>, 'className' | 'style'> {}

export const ChangeLog: React.FC<Props> = ({ className, ...props }) => {
  return (
    <div className={clsx('ChangeLog', className)} {...props}>
      {Object.entries(changelog).map(([section, items]) => (
        <div key={section}>
          <b>{section}</b>
          <ul>
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
        Full release notes are available{' '}
        <Link href={`${environment.urls.github}/releases/latest`} target="_blank">
          here
        </Link>
      </p>
    </div>
  )
}
