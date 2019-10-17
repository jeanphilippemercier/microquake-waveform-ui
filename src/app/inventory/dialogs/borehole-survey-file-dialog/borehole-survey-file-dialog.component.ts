import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { PageMode } from '@interfaces/core.interface';
import { MaintenanceEvent } from '@interfaces/maintenance.interface';
import { BoreholeSurveyFileDialogData } from '@interfaces/dialogs.interface';
import { FormBuilder, Validators } from '@angular/forms';
import { InventoryApiService } from '@services/inventory-api.service';
import { NgxFileDropEntry, FileSystemFileEntry } from 'ngx-file-drop';
import { ToastrNotificationService } from '@services/toastr-notification.service';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-borehole-survey-file-dialog',
  templateUrl: './borehole-survey-file-dialog.component.html',
  styleUrls: ['./borehole-survey-file-dialog.component.scss']
})
export class BoreholeSurveyFileDialogComponent {
  PageMode = PageMode;
  model: MaintenanceEvent;
  files: NgxFileDropEntry[];
  unuploadedFile: any;

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
    private _toastrNotificationService: ToastrNotificationService,
    private _ngxSpinnerService: NgxSpinnerService
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

  async dropped([file]: NgxFileDropEntry[]) {
    console.log(file);

    this.unuploadedFile = {
      file: file.relativePath,
      fileObj: file,
      readyToUpload: true,
      uploading: false,
      error: false
    };
  }

  onSaveClicked() {
    if (!this.myForm.value.collar_x || !this.myForm.value.collar_y || !this.myForm.value.collar_z) {
      this._toastrNotificationService.error('Collar values must be defined');
      return;
    }

    if (!this.unuploadedFile) {
      this._toastrNotificationService.error('No file to upload');
      return;
    }
    const droppedFile = this.unuploadedFile.fileObj;

    if (droppedFile.fileEntry.isFile) {
      const fileEntry = droppedFile.fileEntry as FileSystemFileEntry;
      fileEntry.file(async (file: File) => {
        try {
          this.loadingDialogStart();
          const formData = new FormData();
          formData.append('survey_file', file);
          formData.append('collar_x', this.myForm.value.collar_x + '');
          formData.append('collar_y', this.myForm.value.collar_y + '');
          formData.append('collar_z', this.myForm.value.collar_z + '');
          this.unuploadedFile.readyToUpload = false;
          this.unuploadedFile.uploading = true;
          const response = await this._inventoryApiService.addGyroSurveyAttachmentToBorehole(this.dialogData.id, formData).toPromise();
          Object.assign(this.unuploadedFile, response);
          this.unuploadedFile.uploading = false;
          this.unuploadedFile = null;
          this._matDialogRef.close(true);
        } catch (err) {
          this.unuploadedFile.uploading = false;
          this.unuploadedFile.error = true;
          console.error(err);
          this._toastrNotificationService.error(err);
        } finally {
          this.loadingDialogStop();
        }

      });
    } else {
      this._toastrNotificationService.error('Folder uploads are not supported');
    }

  }

  async loadingDialogStart() {
    await this._ngxSpinnerService.show('loadingDialog', { fullScreen: true, bdColor: 'rgba(51,51,51,0.25)' });
  }
  async loadingDialogStop() {
    await this._ngxSpinnerService.hide('loadingDialog');
  }
}
