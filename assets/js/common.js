var project = undefined;
var classes = {};
var max_results = 5;

function getFromStorage(item) {
  /**
   * Lấy item từ kho lưu trữ của Client
   */
  return localStorage.getItem(item);
}

function putInStorage(item, value) {
  /**
   * Thêm 1 item:value vào kho lưu trữ của Client
   */
  localStorage.setItem(item, value);
}

function getQueryString(name) {
  /**
   * Đọc chuỗi truy vấn từ URL
   */
  let urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

function errorHandler(custom_message, e) {
  /**
   * Hàm xử lý lỗi try...catch
   */
  $("body").empty();
  thongBao(custom_message, "error", 999999);
  console.error(e.message);
}

async function getProject(model_type, project_id) {
  /**
   * Lấy thông tin dự án 
   * @param {string} model_type: Kiểu mô hình của bài toán
   * @param {string} project_id: ID của dự án quy định trong project.json
   */
  try {
    const response = await fetch(`/assets/json/${model_type}_projects.json`);
    const data = await response.json();
    project = data[project_id];

    if (!project) {
      errorHandler("Không tìm thấy thông tin dự án. Thử lại !", e);
    }
  } catch (e) {
    errorHandler("Không tìm thấy thông tin dự án. Thử lại !", e);
  }
}

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

function loadingSpinner(status) {
  /**
   * Đổi trạng thái Loading Spinner
   * @param {string} status: Trạng thái hiển thị [show, hide]
   */
  const loadingSpinner = $("#loadingSpinner");
  status === "show" ? loadingSpinner.show() : loadingSpinner.hide();
}

function scrollDown() {
  /**
   * Kéo trang xuống dưới
   */
  const x = $(window).scrollTop();
  $("html, body").animate({ scrollTop: x + 600 });
}

function chartZone(status) {
  /**
   * Đổi trạng thái hiển thị phần tử ChartZone
   * @param {string} status: Trạng thái hiển thị [show, hide]
   */
  const chartZone = $("#chartZone");
  status === "show" ? chartZone.show() : chartZone.hide();
}

function predResult(status) {
  /**
   * Đổi trạng thái hiển thị phần tử predResult
   * @param {string} status: Trạng thái hiển thị [show, hide]
   */
  const predResult = $("#predResult");
  status === "show" ? predResult.show() : predResult.hide();
}

function btnPred(status) {
  /**
   * Đổi trạng thái hiển thị bật/tắt phần tử btnPred
   * @param {string} status: Trạng thái hiển thị [enable, disable]
   */
  const btnPred = $("#btnPred");
  const enabledClass = "bg-blue-700 dark:bg-blue-800 hover:bg-blue-800";
  const disabledClass = "bg-blue-400 dark:bg-blue-500 cursor-not-allowed";

  if (status === "enable") {
    btnPred.prop("disabled", false);
    btnPred.addClass(enabledClass);
    btnPred.removeClass(disabledClass);
  } else if (status === "disable") {
    btnPred.prop("disabled", true);
    btnPred.removeClass(enabledClass);
    btnPred.addClass(disabledClass);
  }
}

function resetpredResult() {
  /**
   * Khôi phục giá trị mặc định phần tử predResult, đồng thời ẩn ChartZone
   */
  const predResult = $("#predResult");
  predResult.find("#topResult").text("N/A");
  predResult.find("#topAcc").text("0.0");
  predResult.find("#topLoss").text("0.0");
  chartZone("hide");
}

async function loadDOM() {
  const model_type = getQueryString("model_type");
  const project_id = getQueryString("project_id");

  if (!model_type || !project_id) {
    $("body").empty();
    thongBao(
      "Chưa chỉ định tham số model_type & project_id !",
      "error",
      999999
    );
    return;
  }

  await getProject(model_type, project_id);

  if (model_type === "classification") {
    await getClasses();
  }

  $("meta[name='description']").attr("content", project.description);
  $("title").text(project.description);
  $("h1").text(project.description);
}

function thongBao(message, status, timer = 2200) {
  /**
   * Hiện thông báo lên DOM
   * @param {string} message Nội dung thông báo
   * @param {string} status Biểu tượng trạng thái
   * @param {number} timer Thời gian hiển thị
   */
  Swal.fire({
    position: "top",
    icon: status,
    title: message,
    showConfirmButton: false,
    timer: timer,
    toast: true,
  });
}

$(document).ready(async () => {
  await loadDOM();
  btnPred("disable");
});
