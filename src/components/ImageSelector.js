import React, {useRef} from 'react'

import "../styles/components/image-selector.styles.scss"
/*

    add drag an drop
*/

const ImageSelector = ({onChange}) => {

    const fileInputRef = useRef()

    const preOnChange = (e) => {
        // check if they are images
        onChange(e.target.files)
    }

    return (
        <label className="image-selector">
            <div>
                Click to select images
            </div>
            <input type="file" name="images" multiple onChange={preOnChange} ref={fileInputRef}/>
        </label>
    )
}

export default ImageSelector