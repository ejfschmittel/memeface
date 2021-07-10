import { image } from '@tensorflow/tfjs'
import React from 'react'

import "../styles/components/image-display.styles.scss"

const ImageDisplay = ({image}) => {



    return (
        <div className="image-display">

            <img src={image?.src} className="image-display__img"/>
            
        </div>
    )
}

export default ImageDisplay