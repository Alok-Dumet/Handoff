import { type AemPageConfig } from '@handoff/contracts';

export abstract class AemPageContentAdapter {
  abstract getPageConfig(): AemPageConfig;
}
