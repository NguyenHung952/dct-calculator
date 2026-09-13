const DCT_EPSILON = 1e-12;

function getMatrixSize() {
    const rows = Number.parseInt(document.getElementById("matrixRows").value, 10);
    const cols = Number.parseInt(document.getElementById("matrixCols").value, 10);

    if (!Number.isInteger(rows) || rows < 1 || rows > 10 ||
        !Number.isInteger(cols) || cols < 1 || cols > 10) {
        throw new Error("Số hàng và số cột phải là số nguyên từ 1 đến 10.");
    }

    return { rows, cols };
}

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

    // Orthonormal DCT-II:
    // X[k] = alpha(k) * sum(n=0..N-1) x[n] cos(pi(2n+1)k/(2N))
    // alpha(0) = sqrt(1/N), alpha(k>0) = sqrt(2/N)
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

    // Separable 2-D DCT: first along rows, then along columns.
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

function formatMatrix(matrix) {
    return "<table>" + matrix
        .map(row => "<tr>" + row
            .map(value => `<td>${Number.isFinite(value) ? format2(value) : "0.00"}</td>`)
            .join("") + "</tr>")
        .join("") + "</table>";
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

function showError(error) {
    document.getElementById("matrixResult").innerHTML =
        `<p style="color: #b00020;">${error.message}</p>`;
}

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
