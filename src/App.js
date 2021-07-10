

import {useState} from "react"
import "./styles/main.scss"


/*



  wide progress bar
  wide download button

 */

import ImageSelector from "./components/ImageSelector"
import ImageProcessor from "./components/ImageProcessor"


function App() {


  const [uploadedImages, setUploadedImages] = useState([])
  const [processedImages, setProcessedImages] = useState([])
  const [hasImages, setHasImages] = useState(false)



  const onImagesChange = (images) => {
    // change display mode
    // set images

    if(images && images.length !== 0){
      setUploadedImages(images)
      setHasImages(true)
    }
  }

  return (
    <div className="App">
      <div className="app-container">
        <header>
            <h1 className="title">Meme Face - Image Extractor</h1>
        </header>

        <div className="content-area">

          {hasImages ? 
            <ImageProcessor images={uploadedImages} />
          :
            <ImageSelector onChange={onImagesChange}/>
          }
            



        </div>
      </div>
    </div>
  );
}

export default App;
