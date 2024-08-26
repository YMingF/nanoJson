import { Injectable } from '@angular/core';
import { merge } from 'lodash';

@Injectable({
  providedIn: 'root',
})
export class DocProcessService {
  jsonSettingData: any = {};
  extractText(input: string): { en: string; tc: string } {
    const enPattern = /[A-Za-z][^\u4e00-\u9fff]*/;
    const tcPattern = /[\u4e00-\u9fff][^A-Za-z]*/;

    const enMatch = input.match(enPattern);
    const tcMatch = input.match(tcPattern);

    return {
      en: enMatch ? enMatch[0].trim() : '',
      tc: tcMatch ? tcMatch[0].trim() : '',
    };
  }

  processTableData(data: string[][]): any[] {
    const jsonData = data.map((row) => {
      const fieldName = row[1];
      const fieldType = row[2];
      const remark = row[3];
      const { en, tc } = this.extractText(fieldName.replace('\n', ' '));

      const entry: any = {
        label: { en, tc },
        custClass: 'input-field',
        id: this.generateId(fieldName),
      };

      // 根据 fieldType 插入不同的类型
      if (/picker/i.test(fieldType)) {
        Object.assign(entry, {
          type: 'customPicker',
          subType: 'filter',
          canClear: true,
          placeholder: {
            en: 'Please select',
            tc: '請選擇',
          },
        });
      } else if (/text/i.test(fieldType)) {
        entry.type = 'text';
        this.setMax(fieldType, entry);
      } else if (/num/i.test(fieldType)) {
        entry.type = 'number';
        entry.subType = 'desktop';
        this.setMax(fieldType, entry);
      } else if (/label/i.test(fieldType)) {
        entry.type = 'label';
        delete entry.id;
      } else if (/Radio/i.test(fieldType)) {
        entry.type = 'radios';
        entry.canUnselect = true;
      } else if (/Section header/i.test(fieldType)) {
        entry.type = 'section';
        entry.custClass = 'section-box-header';
      } else if (/date/i.test(fieldType)) {
        entry.type = 'multi_format_date';
      }
      merge(entry, this.jsonSettingData[entry.type]);

      // 根据 remark 插入只读属性
      if (/\bread only\b/i.test(remark)) {
        entry.readonly = true;
      } else if (/\bMandatory\b/i.test(remark)) {
        entry.mandatory = true;
      }

      return entry;
    });
    console.log(`jsonData`, jsonData);
    return jsonData;
  }

  private generateId(text: string): string {
    const cleanedText = text
      .replace(/[^a-zA-Z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
    const words = cleanedText.split(' ');
    const stopWords = new Set([
      'the',
      'and',
      'or',
      'a',
      'an',
      'in',
      'on',
      'with',
      'for',
      'to',
      'from',
      'by',
      'of',
      'is',
      'are',
      'was',
      'were',
      'this',
      'that',
      'these',
      'those',
      'it',
      'its',
      'as',
      'at',
      'be',
      'but',
      'not',
    ]);

    const filteredWords = words.filter((word) => !stopWords.has(word));
    // @ts-ignore
    const wordFreq = filteredWords.reduce(
      (acc: any, word: string) => ((acc[word] = (acc[word] || 0) + 1), acc),
      {}
    );
    // @ts-ignore
    const sortedWords = Object.keys(wordFreq).sort(
      (a, b) => wordFreq[b] - wordFreq[a] || b.length - a.length
    );

    return sortedWords
      .slice(0, 3)
      .map((word, index) =>
        index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
      )
      .join('');
  }

  setMax(strVal: string, entry: any): void {
    const matchRes = /\((\d+),?(\d+)?\)/.exec(strVal);
    if (matchRes) {
      const integerPartLength = parseInt(matchRes[1], 10);
      const decimalPartLength = matchRes[2] ? parseInt(matchRes[2], 10) : 0;

      // 动态生成 max 值，例如 4 -> 9999, 3 -> 999
      entry.max = parseFloat(
        '9'.repeat(integerPartLength) +
          (decimalPartLength > 0 ? '.' + '9'.repeat(decimalPartLength) : '')
      );

      // 设置 decimal 属性，如果存在
      if (decimalPartLength > 0) {
        entry.decimal = decimalPartLength;
      }
    }
  }
}
