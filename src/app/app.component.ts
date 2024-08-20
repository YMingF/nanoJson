import { AfterViewInit, Component, Inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import JSZip from 'jszip';
import { DocProcessService } from './services/doc-process.service';
import 'jsoneditor/dist/jsoneditor.css';
import { JSONEditorOptions } from 'jsoneditor';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NzButtonComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit, AfterViewInit {
  jsonEditor: any;
  constructor(
    private docProcessSvc: DocProcessService,
    @Inject(DOCUMENT) private document: Document
  ) {}
  ngOnInit() {}
  ngAfterViewInit() {
    this.initializeJsonEditor();
    this.subscribeFileUpload();
  }

  private subscribeFileUpload() {
    this.document
      .getElementById('upload-docx')!
      .addEventListener('change', (event) => {
        const inputEl = event.target as HTMLInputElement;
        const file = inputEl.files?.[0];
        if (file) {
          this.readDocx(file);
          inputEl.value = '';
        }
      });
  }

  private initializeJsonEditor() {
    if (typeof window !== 'undefined') {
      import('jsoneditor').then((JSONEditorModule) => {
        const JSONEditor = JSONEditorModule.default;
        const container = document.getElementById('jsonEditor');
        if (!container) {
          return;
        }
        const options = { mode: 'code' } as JSONEditorOptions;
        this.jsonEditor = new JSONEditor(container, options);
      });
    }
  }

  uploadFile() {
    this.document.getElementById('upload-docx')?.click();
  }

  readDocx(file: Blob) {
    const reader = new FileReader();

    reader.onload = (event) => {
      const arrayBuffer = event.target?.result;
      if (!arrayBuffer) {
        return;
      }
      this.processDocx(arrayBuffer as Buffer);
    };

    reader.readAsArrayBuffer(file as Blob);
  }

  processDocx(arrayBuffer: Buffer) {
    JSZip.loadAsync(arrayBuffer)
      .then(function (zip) {
        return zip.file('word/document.xml')?.async('string');
      })
      .then((xmlContent) => {
        this.parseXML(xmlContent || '');
      })
      .catch(function (err) {
        console.error('Error reading docx file:', err);
      });
  }

  parseXML(xmlContent: string) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, 'application/xml');
    const tableData = [];

    const tables = xmlDoc.getElementsByTagName('w:tbl');

    for (let i = 0; i < tables.length; i++) {
      const table = tables[i];
      const rows = table.getElementsByTagName('w:tr');

      for (let j = 0; j < rows.length; j++) {
        const row = rows[j];
        const cells = row.getElementsByTagName('w:tc');

        let rowData = [];
        for (let k = 0; k < cells.length; k++) {
          const cell = cells[k];
          const paragraphs = cell.getElementsByTagName('w:t');
          let cellText = '';

          for (let p = 0; p < paragraphs.length; p++) {
            cellText += paragraphs[p].textContent;
          }

          rowData.push(cellText.trim());
        }
        tableData.push(rowData);
      }
    }
    this.jsonEditor.set(this.docProcessSvc.processTableData(tableData));
  }
}
