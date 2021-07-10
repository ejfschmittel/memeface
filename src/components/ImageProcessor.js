import React, {useState, useEffect, useRef} from 'react'
import * as tfjs from '@tensorflow/tfjs';
import * as bodyPix from "@tensorflow-models/body-pix"
import * as blazeface from "@tensorflow-models/blazeface"

import * as tfjsWasm from '@tensorflow/tfjs-backend-wasm';
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-cpu';

import ProgressBar from './ProgressBar'
import ImageDisplay from './ImageDisplay';
import "../styles/components/image-processor.scss";
import { saveAs } from 'file-saver';
import * as JSZip from "jszip"


let blazefaceModel = null;
let bodyPixModel = null;

const ImageProcessor = ({images}) => {

    const canvasOne = useRef();
    const canvasTwo = useRef();


    const [progress, setProgress] = useState(0)
    const [processedImages, setProcessedImages] = useState([])
    const [downloadDisabled, setDownloadDisabled] = useState(true)


    const [currentImage, setCurrentImage] = useState(null)
    const [currentFace, setCurrentFace] = useState(null); 



    useEffect(() => {

        
        // reset
        setProgress(0)
        setProcessedImages([])
        setDownloadDisabled(true)

        // start image processing queue

        processImages(images)
    },[images])

    const loadModels = async () => {
        console.log("loading models...")
        if(!blazefaceModel) blazefaceModel = await blazeface.load();
        if(!bodyPixModel) bodyPixModel = await bodyPix.load();
    }

    const onDownloadClick = () => {
        if(processedImages && processedImages.length > 0){
            var zip = new JSZip();
            for(let i = 0; i < processedImages.length; i++){
                zip.file(processedImages[i].name, processedImages[i]);
            }

            zip.generateAsync({
                type: "blob"
            }).then(function(blob) {
                saveAs(blob, "memefaces.zip");
            }); 
            console.log(processedImages)
        }
    }

    const processImages = async (images) => {

        // check if models are loaded

        await loadModels()

        console.log("processing images...")

        console.log(images)

        const imageArray = Array.from(images)
        setCurrentFace(null)
        
        for(let i = 0; i < imageArray.length; i++){
            await processImage(imageArray[i]);
            setProgress(i+1);
        }

        setDownloadDisabled(false)


    }


    const loadImage = async (image) => {
        console.log(image)
        return new Promise((resolve, reject) => {
            let img = new Image()
            img.onload = () => resolve(img)
            img.onerror = reject

            img.src  =  URL.createObjectURL(image)
           
        })
        
    }

    const loadImageFromCanvas = async (canvas) => {
        return new Promise((resolve, reject) => {
            let img = new Image()
            img.onload = () => resolve(img)
            img.onerror = reject
            img.src  =  canvas.toDataURL("image/png")
           
        })
        
    }

    const canvasToBlob = async (canvas) => {
        return new Promise((resolve, reject) => {
      
            canvas.toBlob((blob) => {
                resolve(blob)
            })

        })
    }

    const processImage = async (image) => {
        // show image in display
        const img = await loadImage(image)
        console.log(img)
        setCurrentImage(img)


        // predict faces placements
        const predictedFaceDimensions = await predictFaces(img)
        console.log(predictedFaceDimensions)


        for(let i = 0; i < predictedFaceDimensions.length; i++){
            console.log("remove backgroud...")
            // crop image
            await cropFace(img, predictedFaceDimensions[i])
            // display cropped image
            const croppedImage = await loadImageFromCanvas(canvasOne.current)
     
            setCurrentFace(croppedImage)

            // remove background
            await segmentFace(canvasOne.current)
            // read image from canvas
            const backgroundFreeFace = await canvasToBlob(canvasOne.current)
            

            console.log(image)
            console.log(image.name)
            backgroundFreeFace.name = `${image.name.split(".")[0]}-f-${i}.png`
        
            // add to final images
            console.log("processed images")
            console.log(backgroundFreeFace)
           

            setProcessedImages(oldImages => [...oldImages, backgroundFreeFace])
        }

      

        // render image placements over image


        // cut and display face 

        // add image to results


    }


    const cropFace = async (img, predictions) => {
        canvasOne.current.width = predictions.width;
        canvasOne.current.height = predictions.height;

        const x = predictions.x ;
        const y = predictions.y ;
        const width = predictions.width;
        const height = predictions.height;
        
        const ctx = canvasOne.current.getContext("2d");   
        ctx.drawImage(img, x,y , width, height, 0, 0, canvasOne.current.width,  canvasOne.current.height)
    }

    const predictFaces = async (image) => {
        const returnTensors = false; // Pass in `true` to get tensors back, rather than values.
        const predictions = await blazefaceModel.estimateFaces(image, returnTensors);

        const predictionDimensions = []
        if (predictions.length > 0) {
            for (let i = 0; i < predictions.length; i++) {
                const start = predictions[i].topLeft;
                const end = predictions[i].bottomRight;
                const size = [end[0] - start[0], end[1] - start[1]];

                const startY = Math.max(start[1] - (size[1] / 1.3), 0)
                const startX = Math.max(start[0] - (size[0] / 4), 0)
                    
                predictionDimensions.push({
                    x: startX,
                    y: startY,
                    width:size[0] * 1.5,
                    height:size[1] * 1.7,
                })
            }
        }
        return predictionDimensions;
    }



    const segmentFace = async (canvas) => {
        const { data:map } = await bodyPixModel.segmentPerson(canvas);
        const ctx = canvas.getContext("2d")
        const { data:imgData } = ctx.getImageData(0, 0, canvas.width, canvas.height);

       
        const newImg = ctx.createImageData(canvas.width, canvas.height);
        const newImgData = newImg.data;

        for(let i=0; i<map.length; i++) {
            //The data array stores four values for each pixel
            const [r, g, b, a] = [imgData[i*4], imgData[i*4+1], imgData[i*4+2], imgData[i*4+3]];
            [
              newImgData[i*4],
              newImgData[i*4+1],
              newImgData[i*4+2],
              newImgData[i*4+3]
            ] = !map[i] ? [255, 255, 255, 0] : [r, g, b, a];
        }


        ctx.putImageData(newImg, 0, 0);
  
    }

    





    

    return (
        <div className="image-processor">


            <div className="image-processor__display">
                <div className="image-processor__display-container">
                    <ImageDisplay image={currentImage} />
                </div>
                <div className="image-processor__display-container">
                    <ImageDisplay image={currentFace} />
                </div>
            </div>

            <ProgressBar progress={progress} total={images.length}/>
            <button disabled={downloadDisabled} className="image-processor__download-btn" onClick={onDownloadClick}>Download</button>

            <div className="image-processor__image-overview">
                    {processedImages.map(image => {
                        return (
                            <div className="image-preview">
                              <img className="image-preview__img" src={URL.createObjectURL(image)} />
                            </div>
                        )
                    })}
            </div>


            <canvas className="image-processor__canvas" ref={canvasOne}></canvas>
            <canvas className="image-processor__canvas" ref={canvasTwo}></canvas>
        </div>
    )
}

export default ImageProcessor