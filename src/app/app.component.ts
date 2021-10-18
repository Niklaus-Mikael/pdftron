import { createOptional } from '@angular/compiler/src/core';
import { Component,AfterViewInit,ViewChild ,ElementRef} from '@angular/core';
import WebViewer from '@pdftron/webviewer';
import { ZipOperator } from 'rxjs/internal/observable/zip';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit{
  @ViewChild('viewer') viewerRef:ElementRef;

  ngAfterViewInit():void{

     WebViewer({
      path:'../assets/lib',
      initialDoc:'https://file-examples-com.github.io/uploads/2017/10/file-example_PDF_500_kB.pdf'

    },this.viewerRef.nativeElement).then((instance) => {
      const { documentViewer, Annotations, Tools, annotationManager } = instance.Core;
      const {iframeWindow} = instance.UI;
      const createSnipTool = function() {
        const SnipTool = function() {
          Tools.RectangleCreateTool.apply(this, arguments);
          this.defaults.StrokeColor = new Annotations.Color(250,0,0,0.5);
          this.defaults.StrokeThickness = 2;
        }
      
        SnipTool.prototype = new Tools.RectangleCreateTool(documentViewer);
        
        return new SnipTool();
      };

      const customSnipTool = createSnipTool();

      instance.UI.registerTool({
        toolName: 'SnipTool',
        toolObject: customSnipTool,
        buttonImage: '../../img/crop1.svg',
        buttonName: 'snipToolButton',
        tooltip: 'Snipping Tool'
      });

      instance.UI.setHeaderItems(header => {
        header.push({
          type: 'toolButton',
          toolName: 'SnipTool',
        });
      });

      const downloadURI = (uri, name) => {
        const link = document.createElement("a");
        link.download = name;
        link.href = uri;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      customSnipTool.addEventListener('annotationAdded', (annotation) => {
        const pageIndex = annotation.PageNumber;
        // get the canvas for the page
        const pageContainer = iframeWindow.document.getElementById('pageContainer' + pageIndex);
        const pageCanvas = pageContainer.querySelector('.canvas' + pageIndex) as HTMLImageElement;
    
        const topOffset = parseFloat(window.getComputedStyle(pageCanvas,null).getPropertyValue('top')) || 0;
        const leftOffset = parseFloat(window.getComputedStyle(pageCanvas,null).getPropertyValue('left')) || 0;
        const zoom = documentViewer.getZoom();
    
        const x = annotation.X * zoom - leftOffset;
        const y = annotation.Y * zoom - topOffset;
        const width = annotation.Width * zoom;
        const height = annotation.Height * zoom;
    
        const copyCanvas = document.createElement('canvas');
        copyCanvas.width = width;
        copyCanvas.height = height;
        const ctx = copyCanvas.getContext('2d');
        // copy the image data from the page to a new canvas so we can get the data URL
        ctx.drawImage(pageCanvas, x, y, width, height, 0, 0, width, height);
        downloadURI(copyCanvas.toDataURL(), "snippet.png");
    
        annotationManager.deleteAnnotation(annotation);
      });

    });
}
}
