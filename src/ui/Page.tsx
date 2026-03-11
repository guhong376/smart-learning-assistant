import React from 'react';
import { Card, Typography } from 'antd';
import type { CardProps } from 'antd';

export function Page(props: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  noCard?: boolean;
  cardProps?: CardProps;
}) {
  return (
    <div>
      <div className="sla-page-title">
        <Typography.Title level={2}>{props.title}</Typography.Title>
        {props.subtitle ? <Typography.Text type="secondary">{props.subtitle}</Typography.Text> : null}
      </div>
      {props.noCard ? <>{props.children}</> : <Card {...props.cardProps}>{props.children}</Card>}
    </div>
  );
}


