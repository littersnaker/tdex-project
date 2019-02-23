import React, { PropTypes } from 'react';

function Img(props) {
    return (
        <img className={props.className} src={props.src} alt={props.alt} height={props.height} width={props.width} />
    );
}

// We require the use of src and alt, only enforced by react in dev mode
Img.propTypes = {
    src: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.object,
    ]).isRequired,
    alt: PropTypes.string,
    className: PropTypes.string,
    height: PropTypes.string,
    width: PropTypes.string
};

export default Img;