var model = undefined;
const raw_image = $("img[alt=Raw_Image]")[0];

async function getClasses() {
  /**
   * Lấy thông tin các nhãn của mô hình
   */
  if (project.classes && project.classes !== "N/A") {
    try {
      // Nếu đã có nhãn tại máy Client thì không cần get lại JSON và ngược lại
      let storage_classes = getFromStorage(`${project.name}_classes`);
      if (storage_classes === null || !storage_classes) {
        const response = await fetch(project.classes);
        const data = await response.text();
        // Cắt mỗi nhãn nằm trên một dòng
        const lines = data.split("\n");
        // Lặp qua từng nhãn & thêm chúng vào mảng classes
        lines.forEach((line, index) => {
          classes[index] = line.trim();
        });
        // Lưu nhãn vào kho lưu trữ của Client
        putInStorage(`${project.name}_classes`, JSON.stringify(classes));
      } else {
        // Nếu đã có nhãn tại máy Client thì không cần get lại JSON
        classes = JSON.parse(storage_classes);
      }
      // Chỉ lấy tối đa 5 nhãn có accuracy cao nhất
      max_results = Math.min(Object.keys(classes).length, 5);
    } catch (e) {
      errorHandler("Không thể tải thông tin các nhãn. Thử lại !", e);
    }
  } else {
    errorHandler("Không thể tải thông tin các nhãn. Thử lại !", e);
  }
}

function loadImage(e) {
  /**
   * Upload ảnh từ máy & hiển thị lên DOM
   * @param {string} e Sự kiện input tag thay đổi
   */
  let wrong = false;

  // Đọc tệp ảnh đầu tiên
  const in_file = e.target.files[0];
  // Kiểm tra tệp có phải là ảnh hay không ?
  if (in_file.type.split("/")[0] !== "image") {
    thongBao("Tệp tải lên phải là một ảnh !", "warning");
    wrong = true;
  }

  // Kiểm tra dung lượng tệp tải lên
  if (in_file.size > 10000000) {
    thongBao("Dung lượng của ảnh phải < 10MB !", "warning");
    wrong = true;
  }

  // Nếu không có lỗi thì hiện ảnh vừa up, mở nút Dự đoán & ngược lại
  if (!wrong) {
    // Mở nút dự đoán
    btnPred("enable");
    // Hiển thị ảnh vừa upload
    raw_image.src = URL.createObjectURL(in_file);
    [raw_image.width, raw_image.height] = getImageSize();
    // Khôi phục giá trị predResult mặc định
    resetpredResult();
  } else {
    btnPred("disable");
  }
}

async function loadModel() {
  /**
   * Nạp mô hình
   */
  try {
    switch (project.source) {
      case "google":
        model = await tf.loadLayersModel(project.model);
        break;
      default:
        model = await tf.loadLayersModel(project.model);
        break;
    }
  } catch (e) {
    thongBao(`Có lỗi khi tải mô hình. Thử lại !`, "error");
    console.error(e.message);
  }
}

function getImageSize() {
  /**
   * Xử lý image_size từ JSON
   */
  const [width, height] = project.image_size.split("x").map(Number);
  return [width, height];
}
