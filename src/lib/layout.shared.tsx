import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: 'Hello RL',
    },
    links: [
      {
        text: '教程文档',
        url: '/docs',
        active: 'nested-url',
      },
      {
        text: 'RL 实验室',
        url: '/app',
        active: 'nested-url',
      },
      {
        text: 'Remotion 动效库',
        url: '/motion',
        active: 'nested-url',
      },
    ],
  };
}
