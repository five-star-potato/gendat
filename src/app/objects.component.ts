/* followed the instruction here to integrate with jQuery */
/* http://stackoverflow.com/questions/34762720/using-jquery-globaly-within-angular-2-application */
/// <reference path="../../node_modules/@types/jquery/index.d.ts" />
import { Component, OnInit, NgZone, Pipe } from '@angular/core';
import { Router } from '@angular/router';
import { TRON_GLOBAL, TRON_EVENT, OBJ_TYPE } from './constants';
import { BaseComponent } from './base.component';
import { OrderBy } from './orderby.component';
import { WizardStateService } from "./service/wizard-state";
import { SampleDataService } from "./service/sample-data";
import { ColumnDef, DBObjDef, ProjectService } from "./service/project";
import { fnGetLargeRandomNumber } from './include'

@Component({
    template: `	
        <div class="flexbox-parent">
            <div class="flexbox-item header">
                <h3>Choose one or more tables</h3>
            </div>
            <div class="flexbox-item fill-area content flexbox-item-grow">
                <div class="fill-area-content flexbox-item-grow" style="display:flex; flex-direction:row; padding: 5px">
                    <div style="display:flex; flex-direction:column; width:45%; overflow-y:scroll; border-left:1px solid #DDD; padding-left:4px">
                        <p>Available Database Objects</p>
                        <div *ngFor="let objType of ['U','V','P']">
                            <a href="javascript:void(0)" class="object-type-heading" (click)="toggleAvailView(objType)">
                                <i aria-hidden="true" class="fa fa-chevron-circle-right" style="color:limegreen" *ngIf="isAvailCollapsed[objType]"></i>
                                <i aria-hidden="true" class="fa fa-chevron-circle-down" style="color:darksalmon" *ngIf="!isAvailCollapsed[objType]"></i>
                                &nbsp;{{getObjectTypeName(objType)}}</a><br>
                            <select (change)="setSelected($event.target)" class="form-control" multiple [size]="getAvailObjLength(objType)" 
                                style="border:none;overflow-y:hidden"  [hidden]="isAvailCollapsed[objType] || getAvailObjLength(objType) == 0">
                                <option *ngFor="let obj of objects[objType] | selectedObjects:false" [value]="obj.id">{{obj.name}}</option>
                            </select>
                        </div>
                    </div>
                    <div style="margin:80px 10px 0px 10px; display:flex; flex-direction:column">
                        <button (click)="selectObjsClick()" class="btn btn-sm"><i class="fa fa-arrow-right" aria-hidden="true"></i></button><br>
                        <button (click)="unselectObjsClick()" class="btn btn-sm"><i class="fa fa-arrow-left" aria-hidden="true"></i></button>
                    </div>
                    <div style="display:flex; flex-direction:column; width:45%; overflow-y:scroll; border-left:1px solid #DDD; padding-left:4px">
                        <p>Selected Database Objects</p>
                        <div *ngFor="let objType of ['U', 'V', 'P', 'SQL']">
                            <a href="javascript:void(0)" class="object-type-heading" (click)="toggleSelectedView(objType)">
                                <i aria-hidden="true" class="fa fa-chevron-circle-right" style="color:limegreen" *ngIf="isSelectedCollapsed[objType]"></i>
                                <i aria-hidden="true" class="fa fa-chevron-circle-down" style="color:darksalmon" *ngIf="!isSelectedCollapsed[objType]"></i>
                                &nbsp;{{getObjectTypeName(objType)}}</a>
                                
                                <br>
                            <select *ngIf="objType != 'SQL'" (change)="setUnselected($event.target)" class="form-control" multiple [size]="getSelectedObjLength(objType)" 
                                style="border:none;overflow-y:hidden"  [hidden]="isSelectedCollapsed[objType] || getSelectedObjLength(objType) == 0">
                                <option *ngFor="let obj of objects[objType] | selectedObjects:true" [value]="obj.id">{{obj.name}}</option>
                            </select>
                            <div *ngIf="objType == 'SQL'" >
                                <table class="table table-bordered table-condensed" style="margin-left:20px; width:95%" id="tblSQL" [hidden]="isSelectedCollapsed[objType] || getSelectedObjLength(objType) == 0">
                                    <tr *ngFor="let obj of objects['SQL']">
                                        <td>{{obj.name}}</td>
                                        <td style=''><pre>{{obj.sql}}</pre></td>
                                        <td style="width:70px"><button class="btn btn-primary btn-xs" (click)="editSQL(obj)"><i class="fa fa-pencil-square-o" aria-hidden="true"></i></button>
                                        &nbsp;<button class="btn btn-danger btn-xs" (click)="deleteSQL(obj)"><i class="fa fa-trash-o" aria-hidden="true"></i></button></td>
                                    </tr>
                                </table>    
                                <button style="margin-bottom:5px; margin-left:20px" class="btn btn-primary btn-sm" (click)="addCustomSQL()">Add</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="flexbox-item footer">
                <button style="" class='btn btn-primary nav-btn' (click)="back()">Back</button>
                <button style="" class='btn btn-primary nav-btn' (click)="next()">Next</button>
            </div>
        </div>

<div class="modal fade" id="modalEditor" tabindex="-1" role="dialog" aria-labelledby="myModalLabel">
  <div class="modal-dialog" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
        <h4 class="modal-title">Edit SQL Statement</h4>
      </div>
      <div class="modal-body">
        <div class="form-group">
            <label>Name</label>
            <input type="text" class="form-control" [(ngModel)]="currSQLName">
        </div>
        <div class="form-group">
            <label>SQL Statement</label>
            <textarea class="form-control" [(ngModel)]="currSQL"></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-primary" data-dismiss="modal" (click)="saveSQLChanges()">Save changes</button>
        <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
      </div>
    </div>
  </div>
</div>
    `,
    styleUrls: [
        './css/host.css'
    ],
    styles: [
        `pre {
            margin:0 !important;
            max-height:25px;
            padding: 2px;
        }
        #tblSQL.table tr td {
        }
        a.object-type-heading {
            font-weight: bold;
            text-decoration: none;
        }
`   
    ]
    // providers: [ WizardStateService ] -- this will create another instance
})
export class ObjectsComponent extends BaseComponent {
    // objects contains all the objects id and anmes from the database, whether they are selected or not
    objects: { [objType:string]: DBObjDef[] } = { 'U':[], 'V':[], 'P':[], 'SQL':[] }; // U - user table; V - view; P - stored proc
    selectedOpts: any[];
    unselectedOpts: any[];
    currSQL: string;
    currSQLName: string;
    currSQLObj: DBObjDef;
    // isAvailCollapsed and isSelectedCollapsed is to control the open/close of the tree structures of Table/View/Procedure ...
    private isAvailCollapsed: { [objType:string]: boolean } = { 'U': false, 'V': false, 'P': false };
    private isSelectedCollapsed: { [objType:string]: boolean } = { 'U': false, 'V': false, 'P': false };

    constructor(router: Router, ngZone: NgZone, wizardStateService: WizardStateService, dataService: SampleDataService, projectService: ProjectService) {
        super(router, ngZone, wizardStateService, dataService, projectService);
    }
    private getAvailObjLength(objType:string) {
        // cannot be zero - if zero, the SELECT elemet becomes actually bigger (i.e. default size?)
        return this.objects[objType].filter(x => !x.selected).length;
    }
    private getSelectedObjLength(objType:string) {
        return this.objects[objType].filter(x => x.selected).length;
    }
    private toggleAvailView(objType:string) {
        this.isAvailCollapsed[objType] = !this.isAvailCollapsed[objType];
    }
    private toggleSelectedView(objType:string) {
        this.isSelectedCollapsed[objType] = !this.isSelectedCollapsed[objType];
    }
    private saveSQLChanges() {
        this.currSQLObj.sql = this.currSQL;
        this.currSQLObj.name = this.currSQLName;
        this.updateGlobalObjectsSelection();
    }
    private editSQL(obj:DBObjDef) {
        this.currSQLObj = obj;
        this.currSQL = obj.sql; 
        this.currSQLName = obj.name;
        jQuery("#modalEditor").modal();
    }
    private deleteSQL(obj) {
        let sqlObjs = this.objects[OBJ_TYPE.SQL];
        for(let i = sqlObjs.length - 1; i >=0; i--) {
            if (sqlObjs[i].id == obj.id) {
                sqlObjs.splice(i, 1);
                this.currSQLObj = null;
            }
        }
        this.updateGlobalObjectsSelection();
    }
    private addCustomSQL() {
        this.objects[OBJ_TYPE.SQL].push({
            id: fnGetLargeRandomNumber(), // probably a big random number is enough to make it unique
            name: 'Sample SQL',
            sql: "select * from Person.Person where BusinessEntityId = 1",
            objType: OBJ_TYPE.SQL,
            selected: true
        });
        this.updateGlobalObjectsSelection();
    }
    private setSelected(dropdown) {
        this.selectedOpts = [];
        for (var i = 0; i < dropdown.options.length; i++) {
            var optionEle = dropdown.options[i];
            if (optionEle.selected == true) { 
                this.selectedOpts.push(parseInt(optionEle.value));
            }
        }
    }    
    private setUnselected(dropdown) {
        this.unselectedOpts = [];
        for (var i = 0; i < dropdown.options.length; i++) {
            var optionEle = dropdown.options[i];
            if (optionEle.selected == true) { 
                this.unselectedOpts.push(parseInt(optionEle.value)); 
            }
        }
    }    
    private selectObjsClick() {
        for (let objType in this.objects) {
            this.objects[objType].forEach((o) => {
                if (this.selectedOpts.includes(o.id))
                    o.selected = true;
            });
        }
        this.updateGlobalObjectsSelection();
    }
    private unselectObjsClick() {
        for (let objType in this.objects) {
            this.objects[objType].forEach((o) => {
                if (this.unselectedOpts.includes(o.id))
                    o.selected = false;
            });
        }
        this.updateGlobalObjectsSelection();
    }
    back() {
        this.router.navigate(['/connect']);
    }
    // need to update the sequence # for all the objects that were not selected before
    updateGlobalObjectsSelection() {
        var objs: { [objType:string]: DBObjDef[] } = { 
            'U': [], 'V': [], 'P': [], 'SQL':[]
        };
        var maxSeq:number = 0;
        for (let objType in this.objects) {
            let seq: number = Math.max.apply(Math, this.objects[objType].map(function (o) { return o.sequence; })) | 0;
            if (seq > maxSeq) maxSeq = seq;
        }        
        for (let objType in this.objects) {
            this.objects[objType] .forEach((o) => {
                if (o.selected) {
                    objs[objType].push(o);
                    if (!o.sequence) {
                        maxSeq += 10;
                        o.sequence = maxSeq;
                    }
                }
            });
        }
        this.projectService.selectedObjs = objs;
        this.wizardStateService.projectChange({ type: TRON_EVENT.refresh });
    }
    next() {
        this.router.navigate(['/columns']);
    }
    ngOnInit() {
        let prjObjs = this.projectService.selectedObjs;
        this.objects[OBJ_TYPE.SQL] = this.projectService.selectedObjs[OBJ_TYPE.SQL].slice(0);

        //electron.ipcRenderer.send("message");
        this.getSQLFn()(this.projectService.connection, "SELECT object_id, SCHEMA_NAME(schema_id) [Schema], RTRIM(name) [name], RTRIM(type) [type] FROM sys.objects WHERE type in ('U', 'V', 'P') ORDER BY 4, 2, 3",
            (err, res) => {
                this.ngZone.run(() => {
                    let i: number = 0;
                    res.forEach((row) => {
                        let objName = `${row["Schema"]}.${row["name"]}`;
                        let objType = row["type"];
                        let sel: DBObjDef = prjObjs[objType].find((t) => { // was this table already selected in the project?
                            return t.name == objName;
                        });

                        if (sel) { // previously selected table
                            this.objects[objType].push({
                                name: objName,
                                id: row["object_id"],
                                objType: objType,
                                selected: true,
                                rowcount: sel.rowcount,
                                sequence: sel.sequence
                            });
                        }
                        else {
                            this.objects[objType].push({
                                name: objName,
                                id: row["object_id"],
                                objType: objType,
                                selected: false,
                                rowcount: 100,
                                sequence: null
                            });
                        }
                    });
                });
            }
        );
    }
}