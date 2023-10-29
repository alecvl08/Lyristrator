import React, { useEffect } from 'react';
import { Carousel } from 'bootstrap';

interface LyricProps {
    ranking: number,
    lyric_num: number,
    lyric: string,
    lyric_image_1: string,
    lyric_image_2: string,
    lyric_image_3: string,
    scroll_interval: number
}

const LyricImagesCarousel: React.FC<LyricProps> = (
    {
        ranking,
        lyric_num,
        lyric,
        lyric_image_1,
        lyric_image_2,
        lyric_image_3,
        scroll_interval
    }

) => {
    useEffect(() => {
        const carouselElement: HTMLElement = document.getElementById(`carousel${lyric_num}-${ranking}`) as HTMLElement;
    
        if (carouselElement !== null) {
            const carouselInstance: Carousel = new Carousel(carouselElement, {
                interval: false,  // Disable Bootstrap's built-in auto-scrolling
            });
    
            // Custom auto-scrolling logic
            const scroll = () => {
                carouselInstance.next();  // Manually trigger a slide to next item
                setTimeout(scroll, scroll_interval);  // Schedule the next scroll
            };
    
            const initialTimeout = setTimeout(scroll, scroll_interval);  // Schedule the first scroll
    
            // Cleanup timeouts on component unmount
            return () => {
                clearTimeout(initialTimeout);
            };
        }
    }, [lyric_num, ranking, scroll_interval]);

    return (
        <div>
            <p>
                <strong>Lyric {lyric_num}: </strong>{lyric}
            </p>
            <div id={`carousel${lyric_num}-${ranking}`} className="carousel slide">
                <div className="carousel-inner">
                    <div className="carousel-item active">
                        <img src={lyric_image_1} className="d-block w-100"/>
                    </div>
                    <div className="carousel-item">
                        <img src={lyric_image_2} className="d-block w-100"/>
                    </div>
                    <div className="carousel-item">
                        <img src={lyric_image_3} className="d-block w-100"/>
                    </div>
                </div>

                <button className="carousel-control-prev" type="button" data-bs-target={`#carousel${lyric_num}-${ranking}`} data-bs-slide="prev">
                    <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                    <span className="visually-hidden">Previous</span>
                </button>
                <button className="carousel-control-next" type="button" data-bs-target={`#carousel${lyric_num}-${ranking}`} data-bs-slide="next">
                    <span className="carousel-control-next-icon" aria-hidden="true"></span>
                    <span className="visually-hidden">Next</span>
                </button>
            </div>
        </div>
    )
}

export default LyricImagesCarousel;