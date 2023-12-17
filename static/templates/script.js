// Welcome Animation
setTimeout(function () {
    $("#welcome").fadeOut(0);
    document.getElementById("hintUsage").style.display="grid";
    console.log('Why did you open the console? (⑉･̆⌓･̆⑉)');
}, 2000);


$(document).ready(function(){

    // Hint
    $("#hintUsageBtn").click(function() {
        $('#hintUsage').hide();
        $('#hintWifi').css('display', 'grid');
    });

    $("#hintWifiBtn").click(function() {
        $('#hintWifi').hide();
        $('#main').css('display', 'grid');

        // Camera Start
        if ($(window).width() <= 767) {
            cameraView(currentFacingMode);
        }
    });


    // Camera
    const supports = navigator.mediaDevices.getSupportedConstraints();
    if (!supports || !supports['facingMode']) {
        alert('Browser not supported.');
        return;
    }

    var currentFacingMode = 'user';
    async function cameraView(facingMode) {
        var constraints = { video: { facingMode: facingMode }, audio: false };
    
        await navigator.mediaDevices
            .getUserMedia(constraints)
            .then(function(stream) {
                const videoElement = $("#cameraView")[0];

                videoElement.style.transform = facingMode === 'user' ? 'scaleX(-1)' : 'scaleX(1)';
                videoElement.srcObject = stream;
                videoElement.play();
            })
            .catch(function(error) {
                alert('Please allow camera access.');
            });
    }


    // Camera View Switch Front & Back
    $("#switch").click(function() {
        currentFacingMode = (currentFacingMode === 'user') ? 'environment' : 'user';
        cameraView(currentFacingMode);
    });

  
    // Crop Image
    function cropImage(imagePath, callback) {
        const image = new Image();
    
        image.onload = function() {
            const container = document.getElementById('cameraView');
            
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
         
            const containerWidth = container.offsetWidth;
            const containerHeight = container.offsetHeight;

            var dpr = window.devicePixelRatio ? window.devicePixelRatio : 1;

            canvas.width = Math.floor(containerWidth * dpr);
            canvas.height = Math.floor(containerHeight * dpr);

            ctx.scale(dpr, dpr);

            var inX, inY;
            var inSize;

            if (image.width > image.height) {
                inSize = image.height;
                inX = image.width / 2 - (inSize / 2);
                inY = 0;
            } else if (image.width < image.height) {
                inSize = image.width;
                inX = 0;
                inY = image.height / 2 - (inSize / 2);;
            } else {
                inSize = image.width;
                inX = 0;
                inY = 0;
            }

            ctx.drawImage(image, Math.floor(inX), Math.floor(inY), Math.floor(inSize), Math.floor(inSize), 0, 0, containerWidth, containerHeight);
            const croppedImageDataUrl = canvas.toDataURL();
    
            callback(null, croppedImageDataUrl);
        };
    
        image.src = imagePath;
    
        image.onerror = function() {
            callback(new Error('Failed to load image.'));
        };
    }


    // Horizontal Flip Image
    function flipImage(imagePath, callback) {
        const image = new Image();

        image.onload = function() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            canvas.width = image.width;
            canvas.height = image.height;

            ctx.drawImage(image, 0, 0);
            ctx.translate(image.width, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(image, 0, 0);

            const flippedImageDataUrl = canvas.toDataURL();
            callback(null, flippedImageDataUrl);
        }
        image.src = imagePath;

        image.onerror = function() {
            callback(new Error('Failed to load image.'));
        };
    }


    // Capture Image
    function captureImage() {
        const videoElement = document.getElementById('cameraView');
        const imgElement = document.getElementById('photoView');

        $('#photoPage').show();

        // Get Video Frame
        const canvasElement = document.createElement('canvas');
        const ctx = canvasElement.getContext('2d');
        canvasElement.width = videoElement.videoWidth;
        canvasElement.height = videoElement.videoHeight;
        ctx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);

        const imagePath = canvasElement.toDataURL();

        cropImage(imagePath, function(error, croppedImageDataUrl) {
            if (error) {
                console.error(error);
            } else if (videoElement.style.transform == 'scaleX(-1)') {
                flipImage(croppedImageDataUrl, function(error, flippedImageDataUrl) {
                    if (error) {
                        console.error(error);
                    } else {
                        $('#cameraPage').hide();
                        imgElement.src = flippedImageDataUrl;
                    }
                });
            } else {
                $('#cameraPage').hide();
                imgElement.src = croppedImageDataUrl;
            }
        });
    }

    $('#capture').on('click', function() {
        captureImage();
    });


    // Upload Image
    $("#uploadImage").change(function(event) {
        const file = event.target.files[0];
        $('#photoPage').show();

        cropImage(URL.createObjectURL(file), function(error, croppedImageDataUrl) {
            if (error) {
                console.error(error);
            } else {
                $('#cameraPage').hide();
                $('#photoView').attr('src', croppedImageDataUrl);
            }
        });
        $("#uploadImageInput").val(''); 
    });


    // Go Back to Camera Page
    $("#goBack").click(function() {
        $('#cameraPage').show();
        $('#photoPage').hide();

        if (originalImageSrc) {
            originalImageSrc = null;
        }
    });


    // Download Image
    $("#download").click(function() {
        $('#photoView').css('background-image', 'none');
    
        html2canvas(document.getElementById('photoView'), { width: $('#photoView').outerWidth(), height: $('#photoView').outerHeight() }).then(function(canvas) {
            canvas.toBlob(function(blob) {
                var link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = 'image.png';
        
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }, 'image/png', 1.0);
        });        
    });


    // Stylize Image
    let originalImageSrc;
    $(".style-button").on("click", function () {
        var styleIndex = $(this).data("style");
    
        $(".loading-overlay").css("display", "block");
    
        if (!originalImageSrc) {
            originalImageSrc = $("#photoView").attr("src");
        }
        var formData = new FormData();
        formData.append("style_index", styleIndex);

        fetch(originalImageSrc)
            .then(response => response.blob())
            .then(blob => {
                formData.append("file", blob, "content.png");

                // Move AJAX request inside the fetch then block
                return $.ajax({
                    type: "POST",
                    url: "/",
                    data: formData,
                    contentType: false,
                    processData: false
                });
            })
            .then(data => {
                if (data) {
                    const imageURL = URL.createObjectURL(data);
                    alert(imageURL);
                    function imageLoadCallback() {
                        $(".loading-overlay").css("display", "none");
                    }
                    
                    $("#photoView").on("load", imageLoadCallback);
                    $("#photoView").attr("src", imageURL);
                } else {
                    console.error("Error:", data.error);
                }
            })
            .catch(error => {
                console.error("Error fetching original image:", error);
                $(".loading-overlay").css("display", "none");
            });
    }  
)});