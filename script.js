const DCT_EPSILON = 1e-12;
const BLOCK_SIZE = 8;

// RGB -> YUV equations used in the course material.
const Y_R = 0.299;
const Y_G = 0.587;
const Y_B = 0.114;
const U_DENOMINATOR = 2.03;
const V_DENOMINATOR = 1.14;

// Typical weighting matrix Wi,j from the course material (Figure 4.20).
const WEIGHTING_MATRIX = [
    [8, 16, 19, 22, 26, 27, 29, 34],
    [16, 16, 22, 24, 27, 29, 34, 37],
    [19, 22, 26, 27, 29, 34, 34, 38],
    [22, 22, 26, 27, 29, 34, 37, 40],
    [22, 26, 27, 29, 32, 35, 40, 48],
    [26, 27, 29, 32, 35, 40, 48, 58],
    [26, 27, 29, 34, 38, 46, 56, 69],
    [27, 29, 35, 38, 46, 56, 69, 83]
];

function round2(value) {
    const rounded = Math.round((value + Math.sign(value) * Number.EPSILON) * 100) / 100;
    return Object.is(rounded, -0) ? 0 : rounded;
}

function format2(value) {
    return round2(value).toFixed(2);
}

function dct1D(signal) {
    const N = signal.length;
    const result = new Array(N).fill(0);

    // Orthonormal DCT-II used by the course material.
    for (let k = 0; k < N; k++) {
        let sum = 0;

        for (let n = 0; n < N; n++) {
            sum += signal[n] * Math.cos((Math.PI * (2 * n + 1) * k) / (2 * N));
        }

        const alpha = k === 0 ? Math.sqrt(1 / N) : Math.sqrt(2 / N);
        const value = alpha * sum;
        result[k] = Math.abs(value) < DCT_EPSILON ? 0 : value;
    }

    return result;
}

function dct2D(matrix) {
    const rows = matrix.length;
    const cols = matrix[0].length;

    // Separable 2-D DCT: horizontal transform, then vertical transform.
    const rowTransformed = matrix.map(row => dct1D(row));
    const result = Array.from({ length: rows }, () => new Array(cols).fill(0));

    for (let col = 0; col < cols; col++) {
        const column = rowTransformed.map(row => row[col]);
        const transformedColumn = dct1D(column);

        for (let row = 0; row < rows; row++) {
            result[row][col] = transformedColumn[row];
        }
    }

    return result;
}

function formatMatrix(matrix, decimals = 2) {
    return "<table>" + matrix
        .map(row => "<tr>" + row
            .map(value => {
                const formatted = decimals === 0 ? String(Math.round(value)) : format2(value);
                return `<td>${formatted}</td>`;
            })
            .join("") + "</tr>")
        .join("") + "</table>";
}

function create8x8Input(containerId, initialValue = 0) {
    const container = document.getElementById(containerId);
    container.innerHTML = "";
    const table = document.createElement("table");

    for (let row = 0; row < BLOCK_SIZE; row++) {
        const tr = document.createElement("tr");

        for (let col = 0; col < BLOCK_SIZE; col++) {
            const td = document.createElement("td");
            const input = document.createElement("input");
            input.type = "number";
            input.min = "0";
            input.max = "255";
            input.step = "1";
            input.value = initialValue;
            input.className = `${containerId}-cell rgb-cell`;
            input.dataset.row = row;
            input.dataset.col = col;
            td.appendChild(input);
            tr.appendChild(td);
        }

        table.appendChild(tr);
    }

    container.appendChild(table);
}

function read8x8Input(containerId) {
    const inputs = document.querySelectorAll(`#${containerId} .rgb-cell`);

    if (inputs.length !== BLOCK_SIZE * BLOCK_SIZE) {
        throw new Error("Khối RGB phải có đúng kích thước 8×8.");
    }

    return Array.from({ length: BLOCK_SIZE }, (_, row) =>
        Array.from({ length: BLOCK_SIZE }, (_, col) => {
            const input = document.querySelector(`#${containerId} .rgb-cell[data-row="${row}"][data-col="${col}"]`);
            const value = Number.parseFloat(input.value);

            if (!Number.isFinite(value) || value < 0 || value > 255) {
                throw new Error("Giá trị R, G, B phải nằm trong khoảng 0–255.");
            }

            return value;
        })
    );
}

function rgbToYuv(r, g, b) {
    const y = Y_R * r + Y_G * g + Y_B * b;
    const u = (b - y) / U_DENOMINATOR;
    const v = (r - y) / V_DENOMINATOR;
    return { y, u, v };
}

function convertRgbMatricesToYuv(rMatrix, gMatrix, bMatrix) {
    const y = Array.from({ length: BLOCK_SIZE }, () => new Array(BLOCK_SIZE));
    const u = Array.from({ length: BLOCK_SIZE }, () => new Array(BLOCK_SIZE));
    const v = Array.from({ length: BLOCK_SIZE }, () => new Array(BLOCK_SIZE));

    for (let row = 0; row < BLOCK_SIZE; row++) {
        for (let col = 0; col < BLOCK_SIZE; col++) {
            const converted = rgbToYuv(rMatrix[row][col], gMatrix[row][col], bMatrix[row][col]);
            y[row][col] = converted.y;
            u[row][col] = converted.u;
            v[row][col] = converted.v;
        }
    }

    return { y, u, v };
}

function quantizeDct(dctMatrix, quantStep) {
    return dctMatrix.map((row, i) =>
        row.map((coefficient, j) =>
            Math.round(coefficient / (quantStep * WEIGHTING_MATRIX[i][j]))
        )
    );
}

function showPipelineComponent(title, matrix, decimals = 2) {
    return `<div class="result-block"><h4>${title}</h4>${formatMatrix(matrix, decimals)}</div>`;
}

function runRgbYuvDctQuantization() {
    const quantStep = Number.parseFloat(document.getElementById("quantStep").value);

    if (!Number.isFinite(quantStep) || quantStep <= 0) {
        throw new Error("Bước lượng tử Q phải lớn hơn 0.");
    }

    const r = read8x8Input("rInput");
    const g = read8x8Input("gInput");
    const b = read8x8Input("bInput");
    const yuv = convertRgbMatricesToYuv(r, g, b);

    const dctY = dct2D(yuv.y);
    const dctU = dct2D(yuv.u);
    const dctV = dct2D(yuv.v);

    const quantY = quantizeDct(dctY, quantStep);
    const quantU = quantizeDct(dctU, quantStep);
    const quantV = quantizeDct(dctV, quantStep);

    const result = document.getElementById("pipelineResult");
    result.innerHTML = `
        <h3>Kết quả pipeline</h3>
        <p><strong>Q = ${format2(quantStep)}</strong></p>
        <h3>YUV</h3>
        <div class="result-grid">
            ${showPipelineComponent("Y", yuv.y)}
            ${showPipelineComponent("U", yuv.u)}
            ${showPipelineComponent("V", yuv.v)}
        </div>
        <h3>DCT 8×8</h3>
        <div class="result-grid">
            ${showPipelineComponent("DCT(Y)", dctY)}
            ${showPipelineComponent("DCT(U)", dctU)}
            ${showPipelineComponent("DCT(V)", dctV)}
        </div>
        <h3>Quantization</h3>
        <p class="formula">Ĉ(i,j) = round(C(i,j) / (Q × W(i,j)))</p>
        <div class="result-grid">
            ${showPipelineComponent("Quantized Y", quantY, 0)}
            ${showPipelineComponent("Quantized U", quantU, 0)}
            ${showPipelineComponent("Quantized V", quantV, 0)}
        </div>
        <h3>Ma trận trọng số W(i,j)</h3>
        ${formatMatrix(WEIGHTING_MATRIX, 0)}
    `;
}

function getMatrixSize() {
    const rows = Number.parseInt(document.getElementById("matrixRows").value, 10);
    const cols = Number.parseInt(document.getElementById("matrixCols").value, 10);

    if (!Number.isInteger(rows) || rows < 1 || rows > 10 ||
        !Number.isInteger(cols) || cols < 1 || cols > 10) {
        throw new Error("Số hàng và số cột phải là số nguyên từ 1 đến 10.");
    }

    return { rows, cols };
}

function readInputMatrix() {
    const { rows, cols } = getMatrixSize();
    const inputs = document.querySelectorAll(".matrix-input");

    if (inputs.length !== rows * cols) {
        throw new Error("Ma trận đầu vào chưa được tạo đúng kích thước.");
    }

    return Array.from({ length: rows }, (_, i) =>
        Array.from({ length: cols }, (_, j) => {
            const value = Number.parseFloat(inputs[i * cols + j].value);
            return Number.isFinite(value) ? value : 0;
        })
    );
}

function showError(error, targetId = "matrixResult") {
    document.getElementById(targetId).innerHTML =
        `<p class="error">${error.message}</p>`;
}

create8x8Input("rInput");
create8x8Input("gInput");
create8x8Input("bInput");

document.getElementById("runPipeline").addEventListener("click", function () {
    try {
        runRgbYuvDctQuantization();
    } catch (error) {
        showError(error, "pipelineResult");
    }
});

document.getElementById("generateMatrix").addEventListener("click", function () {
    try {
        const { rows, cols } = getMatrixSize();
        const matrixInput = document.getElementById("matrixInput");
        matrixInput.innerHTML = "";

        const table = document.createElement("table");

        for (let i = 0; i < rows; i++) {
            const row = document.createElement("tr");

            for (let j = 0; j < cols; j++) {
                const cell = document.createElement("td");
                const input = document.createElement("input");

                input.type = "number";
                input.value = "0";
                input.step = "any";
                input.className = "matrix-input";

                cell.appendChild(input);
                row.appendChild(cell);
            }

            table.appendChild(row);
        }

        matrixInput.appendChild(table);
        document.getElementById("computeDCT1D").style.display = "block";
        document.getElementById("computeDCT2D").style.display = "block";
        document.getElementById("matrixResult").innerHTML = "";
    } catch (error) {
        showError(error);
    }
});

document.getElementById("computeDCT1D").addEventListener("click", function () {
    try {
        const matrix = readInputMatrix();
        const result = matrix.map(row => dct1D(row));

        document.getElementById("matrixResult").innerHTML =
            "<h3>DCT 1D Kết quả:</h3>" + formatMatrix(result);
    } catch (error) {
        showError(error);
    }
});

document.getElementById("computeDCT2D").addEventListener("click", function () {
    try {
        const matrix = readInputMatrix();
        const result = dct2D(matrix);

        document.getElementById("matrixResult").innerHTML =
            "<h3>DCT 2D Kết quả:</h3>" + formatMatrix(result);
    } catch (error) {
        showError(error);
    }
});
