import { module } from 'angular';
import { Duration } from 'luxon';
import { omit, omitBy, isUndefined, sortBy, find } from 'lodash';

import { UUIDGenerator } from 'core/utils/uuid.service';
import { ICache, DeckCacheFactory } from 'core/cache';
import { Ng1StateDeclaration } from '@uirouter/angularjs';
import IAngularEvent = angular.IAngularEvent;

export interface ICacheEntryStateMigrator {
  // a string literal in the state to be replaced (not a regex)
  state: string;
}

export interface IExecutionHistoryEntry {
  params: any;
  state: string;
  accessTime: number;
  extraData: any;
  id: string;
}

const MAX_ITEMS = 5;

export class ExecutionHistoryService {
  private static cache: ICache = DeckCacheFactory.createCache('execution', 'user', {
    version: 3,
    maxAge: Duration.fromObject({ days: 90 }).as('milliseconds'),
  });

  public static getItems(type: any): IExecutionHistoryEntry[] {
    const items: IExecutionHistoryEntry[] = this.cache.get(type) || [];
    return sortBy(items, 'accessTime').reverse();
  }

  public static addItem(type: string, state: string, params: any, keyParams: string[] = []) {
    const items: IExecutionHistoryEntry[] = this.getItems(type).slice(0, MAX_ITEMS);
    const existing: IExecutionHistoryEntry = this.getExisting(items, params, keyParams);
    const entry = {
      params,
      state,
      accessTime: new Date().getTime(),
      extraData: {},
      id: UUIDGenerator.generateUuid(),
    };
    if (existing) {
      items.splice(items.indexOf(existing), 1);
    }
    if (items.length === MAX_ITEMS) {
      items.pop();
    }
    items.push(entry);
    this.cache.put(type, items);
  }

  private static getExisting(
    items: IExecutionHistoryEntry[],
    params: any,
    keyParams: string[],
  ): IExecutionHistoryEntry {
    if (!keyParams || !keyParams.length) {
      return find(items, { params: omitBy(params, isUndefined) });
    }
    return items.find((item) => keyParams.every((p) => item.params[p] === params[p]));
  }

  public static getApplicationParams(appName: string) {
    const items = this.getItems('applications');
    return items.find((item) => item.params.application === appName);
  }
}

export const EXECUTION_HISTORY_SERVICE = 'spinnaker.core.history.ExecutionHistory.service';
module(EXECUTION_HISTORY_SERVICE, []).run([
  '$rootScope',
  ($rootScope: ng.IRootScopeService) => {
    $rootScope.$on('$stateChangeSuccess', (_event: IAngularEvent, toState: Ng1StateDeclaration, toParams: any) => {
      if (
        toState.data &&
        toState.data.history &&
        toState.name === 'home.applications.application.pipelines.executions'
      ) {
        const params = omit(toParams || {}, ['debug', 'vis', 'trace']);
        ExecutionHistoryService.addItem(
          toState.data.history.type,
          toState.name,
          params,
          toState.data.history.keyParams,
        );
      }
    });
  },
]);
