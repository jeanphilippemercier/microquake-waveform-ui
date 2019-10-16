import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { PageMode } from '@interfaces/core.interface';
import { MaintenanceEvent } from '@interfaces/maintenance.interface';
import { BoreholeSurveyFileDialogData } from '@interfaces/dialogs.interface';
import { FormBuilder, Validators } from '@angular/forms';
import { InventoryApiService } from '@services/inventory-api.service';
import { NgxFileDropEntry, FileSystemFileEntry } from 'ngx-file-drop';
import { ToastrNotificationService } from '@services/toastr-notification.service';

@Component({
  selector: 'app-borehole-survey-file-dialog',
  templateUrl: './borehole-survey-file-dialog.component.html',
  styleUrls: ['./borehole-survey-file-dialog.component.scss']
})
export class BoreholeSurveyFileDialogComponent {
  PageMode = PageMode;
  model: MaintenanceEvent;
  files: NgxFileDropEntry[];

  myForm = this._fb.group({
    collar_x: [, Validators.required],
    collar_y: [, Validators.required],
    collar_z: [, Validators.required],
  });

  constructor(
    @Inject(MAT_DIALOG_DATA) public dialogData: BoreholeSurveyFileDialogData,
    private _matDialogRef: MatDialogRef<BoreholeSurveyFileDialogComponent, boolean>,
    private _fb: FormBuilder,
    private _inventoryApiService: InventoryApiService,
    private _toastrNotificationService: ToastrNotificationService
  ) {
    this.myForm.patchValue({
      collar_x: dialogData.colar_x,
      collar_y: dialogData.colar_y,
      collar_z: dialogData.colar_z,
    });
  }

  close() {
    this._matDialogRef.close();
  }

  onCancelClicked() {
    this._matDialogRef.close();
  }

  onSaveClicked() {
    this._matDialogRef.close(true);
  }

  async dropped(files: NgxFileDropEntry[]) {
    this.files = files;
    const unuploaed = files.map(val => ({
      id: null,
      description: null,
      file: val.relativePath,
      fileObj: val,
      uploading: true,
      error: false
    }));
    const tmpFiles = [...this.files];

    for (let i = 0; i < unuploaed.length; i++) {
      const droppedFile = unuploaed[i].fileObj;
      // Is it a file?
      if (droppedFile.fileEntry.isFile) {
        const fileEntry = droppedFile.fileEntry as FileSystemFileEntry;
        fileEntry.file(async (file: File) => {

          try {

            const formData = new FormData();
            formData.append('survey_file', file);
            formData.append('collar_x', this.myForm.value.collar_x + '');
            formData.append('collar_y', this.myForm.value.collar_y + '');
            formData.append('collar_z', this.myForm.value.collar_z + '');
            const response = await this._inventoryApiService.addGyroSurveyAttachmentToBorehole(this.model.id, formData).toPromise();
            Object.assign(unuploaed[i], response);
            unuploaed[i].uploading = false;
          } catch (err) {
            unuploaed[i].uploading = false;
            unuploaed[i].error = true;
            console.error(err);
            this._toastrNotificationService.error(err);
          }

        });
      } else {
        this._toastrNotificationService.error('Folder uploads are not supported');
      }
    }

  }
}
