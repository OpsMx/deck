import React from 'react';
import { useIsActive, useSref } from '@uirouter/react';

import { NavItem } from './NavItem';
import { ApplicationDataSource } from '../service/applicationDataSource';
import { Application } from '../../application';
import { ExecutionHistoryService } from '../../history/executionHistory.service';

export interface INavRouteProps {
  dataSource: ApplicationDataSource;
  app: Application;
}
const getParams = (app: Application, dataSource: ApplicationDataSource) => {
  if (dataSource.label === 'Pipelines') {
    return ExecutionHistoryService.getApplicationParams(app.name)?.params ?? {};
  }
  return {};
};

export const NavRoute = ({ app, dataSource }: INavRouteProps) => {
  const sref = useSref(dataSource.sref, getParams(app, dataSource));
  const isActive = useIsActive(dataSource.activeState);

  return (
    <a {...sref} className={`nav-category flex-container-h middle sp-padding-s-yaxis${isActive ? ' active' : ''}`}>
      <NavItem app={app} dataSource={dataSource} isActive={isActive} />
    </a>
  );
};
