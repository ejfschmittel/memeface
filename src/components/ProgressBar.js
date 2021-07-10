import React from 'react'


import "../styles/components/progress-bar.styles.scss";

const ProgressBar = ({progress, total}) => {


    const filledWidth = `calc(${(progress / total) * 100 }% - 4px)`;
    

    return (
        <div className="progress-bar">

            <div className="progress-bar__display" style={{width: filledWidth}}></div>
            <div className="progress-bar__numbers">{progress}/{total}</div>
        </div>
    )
}

export default ProgressBar