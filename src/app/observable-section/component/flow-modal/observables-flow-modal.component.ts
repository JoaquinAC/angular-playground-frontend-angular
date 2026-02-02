import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-observables-flow-modal',
  templateUrl: './observables-flow-modal.component.html',
  styleUrls: ['./observables-flow-modal.component.scss']
})
export class ObservablesFlowModalComponent implements OnInit {

  ngOnInit(): void {
    console.log("hola");
    
  }

  constructor(
    private dialogRef: MatDialogRef<ObservablesFlowModalComponent>) {}

  close(): void {
    this.dialogRef.close();
  }

}
