"use strict";
class Carousel {
  constructor(options) {
    //set up the class variables
    this.options = options;
    this.chunkSize = 5;
    this.container = document.getElementById(options.container);
    this.buttonNext;
    this.buttonPrev;
    this.carouselWrapper;
    /* create the placeholder cards with the chunk size,
    when all chunks are displayed will be hidden */
    let arePendingElements = true;
    let placeholders = "";
    if (arePendingElements) {
      for (let i = 0; i < this.chunkSize; i++) {
        placeholders += `
          <li class="placeholder">
            <div class="card single loading">
              <div class="image">
              </div>
              <div class="container">
                <div class="title1"></div>
                <div class="title2"></div>
              </div>
            </div>
          </li>
        `;
      }
    }
    // Build the main html code with the cards placeholders
    const html = `
      <div class="carousel">
        <div class="header">
          <div class="icon-container">
            <span class="material-icons">${options.icon}</span>
          </div>
          <div class="text-container">
            <h2 class="title">
              ${options.title}
              <span class="material-icons">
                keyboard_arrow_right
              </span>
            </h2>
            <h3 class="description">${options.subtitle}</h3>
          </div>
        </div>
        <div class="cards-wrapper">
          <ul class="cards">
            ${placeholders}
          </ul>
          <button class="nav prev">
            <span class="material-icons">
              keyboard_arrow_left
            </span>
          </button>
          <button class="nav next">
            <span class="material-icons">
              keyboard_arrow_right
            </span>
          </button>
        </div>
      </div>
      `;
    // put the content inside the container div and execute
    // the scrollers and initial fetch methods
    this.container.innerHTML = html;
    this.applyScrollers();
    this.initFetch();
  }

  /**
   * Given a card object, will insert the card's html inside the carousel
   * @param Object card
   * @returns String
   */
  renderCard = (card) => {
    // initialize the values to be rendered
    const language = card.language ? card.language : "";
    const cardClass =
      card.cardinality === "collection" ? "card collection" : "card";
    let hours = Math.floor(card.duration / 60 / 60);
    const minutes = Math.floor(card.duration / 60) - hours * 60;

    if (hours !== 0 && hours > 1) {
      hours += "hs";
    } else if (hours === 1) {
      hours += "h";
    } else {
      hours = "";
    }

    const humanTime = hours + " " + minutes + "min";
    let cardNode = document.createElement("li");
    cardNode.innerHTML = `
      <li>
        <div class="${cardClass}">
          <div class="image" style="background-image: url(${card.image})">
            <span class="type">${card.type}</span>
            <span class="duration">${humanTime}</span>
          </div>
          <div class="container">
            <h4 class="title">${card.title}</h4>
            <span class="language">${language}</span>
          </div>
        </div>
      </li>
      `;
    // search for the first node...
    const firstNode = document.querySelector(
      `#${this.options.container} ul.cards`
    ).firstChild;
    // insert the generated html before the current first element of the carousel
    document
      .querySelector(`#${this.options.container} ul.cards`)
      .insertBefore(cardNode, firstNode);
  };

  // this methods applies the arrow buttons to navigate the carousel when needed
  applyScrollers = () => {
    // set up local and global
    this.carouselWrapper = this.container.querySelector(".cards-wrapper");
    const carouselContainer = this.container.querySelector(".cards");
    this.buttonNext = this.container.querySelector("button.next");
    this.buttonPrev = this.container.querySelector("button.prev");
    // small helper to get the current carousel dimensions
    const carouselContainerDimensions = () =>
      carouselContainer.getBoundingClientRect();

    //Define the functions for each scrolling direction, according to the carousel size
    const scrollNext = () => {
      carouselContainer.scrollBy({
        left: carouselContainerDimensions().width,
        behavior: "smooth",
      });
    };
    const scrollPrev = () => {
      carouselContainer.scrollBy({
        left: -carouselContainerDimensions().width,
        behavior: "smooth",
      });
    };
    // Attach them with a listener for each arrow click
    this.buttonNext.addEventListener("click", scrollNext);
    this.buttonPrev.addEventListener("click", scrollPrev);

    // Capturing the direction of the swipe and handle the scrolling
    let touchstartX = 0;
    let touchendX = 0;

    // Check if the swipe goes right or left
    const handleGesture = () => {
      if (touchendX < touchstartX) scrollNext();
      if (touchendX >= touchstartX) scrollPrev();
    };

    // Add the listener for when the user press and release the screen
    // and check for its position
    carouselContainer.addEventListener("touchstart", (e) => {
      touchstartX = e.changedTouches[0].screenX;
    });
    carouselContainer.addEventListener("touchend", (e) => {
      touchendX = e.changedTouches[0].screenX;
      handleGesture();
    });

    // apply listners for scroll and resize to check if the arrows should appear or not
    carouselContainer.addEventListener("scroll", this.checkArrowsVisibility);
    window.addEventListener("resize", this.checkArrowsVisibility);

    //add listener to the carousel to display the arrows on mouseover and hide it when gone
    this.carouselWrapper.addEventListener("mouseenter", () => {
      this.checkArrowsVisibility();
    });
    this.carouselWrapper.addEventListener("mouseleave", () => {
      this.hideNextButton();
      this.hidePrevButton();
    });
  };

  //helper method to update the arrows visibility according to the scroll offset
  checkArrowsVisibility = () => {
    const carouselContainer = this.container.querySelector(".cards");
    this.buttonNext = this.container.querySelector("button.next");
    this.buttonPrev = this.container.querySelector("button.prev");
    let scrollLeft = carouselContainer.scrollLeft;
    let scrollWidth = carouselContainer.scrollWidth;
    let offsetWidth = carouselContainer.offsetWidth;
    let contentWidth = scrollWidth - offsetWidth;

    if (contentWidth <= scrollLeft) {
      this.hideNextButton();
    } else {
      this.showNextButton();
    }
    if (scrollLeft === 0) {
      this.hidePrevButton();
    } else {
      this.showPrevButton();
    }
  };

  hideNextButton = () => {
    this.buttonNext.style.opacity = "0.000001";
  };
  showNextButton = () => {
    this.buttonNext.style.opacity = "1";
  };
  hidePrevButton = () => {
    this.buttonPrev.style.opacity = "0.000001";
  };
  showPrevButton = () => {
    this.buttonPrev.style.opacity = "1";
  };
  /**
   * Handles the function fetchCards received from index.html,
   * once the promises are resolved, generates the cards for the chunks.
   * This should be changed to stream reading on a real world api
   */
  initFetch() {
    let response = this.options.fetchCards(this.chunkSize);
    let renderedChunks = 0;
    //iterates the chunks, to render each card once the promise is resolved
    response.forEach((chunk) => {
      return chunk.then((cards) => {
        cards.forEach((card) => {
          this.renderCard(card);
        });
        // check if there are more chunks to be rendered and decide to hide
        // the placeholders or not
        renderedChunks++;
        if (renderedChunks >= response.length) {
          document
            .querySelectorAll(
              `#${this.options.container} ul.cards .placeholder`
            )
            .forEach((node) => {
              node.style.display = "none";
            });
        }
      });
    });
  }
}
