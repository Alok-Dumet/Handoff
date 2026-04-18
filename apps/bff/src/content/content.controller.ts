import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';

@Controller('api/content')
export class ContentController {
  private readonly aemContent: Record<string, unknown>;

  constructor() {
    const filePath = join(__dirname, 'aem-content.json');
    this.aemContent = JSON.parse(readFileSync(filePath, 'utf-8'));
  }

  @Get(':pageKey')
  getContent(@Param('pageKey') pageKey: string) {
    const content = this.aemContent[pageKey];
    if (!content) {
      throw new NotFoundException(`Content not found for key: ${pageKey}`);
    }
    return content;
  }
}
