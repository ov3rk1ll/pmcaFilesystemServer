$(document).on("change", ".checkbox-download-day", function (event) {
    $(".card[data-day='" + $(this).data("day") + "'] .checkbox-download")
        .prop("checked", $(this).prop("checked"))
        .trigger("change");
});

$(document).on("change", ".checkbox-download", function (event) {
    if ($(".checkbox-download:checked").length > 0) {
        $("#download").text(
            "Download " + $(".checkbox-download:checked").length + " files"
        );
        $("#download").show();
    } else {
        $("#download").hide();
    }
});
$("#download").hide();
$("#download").click(function () {
    $("#zip-progress").css("width", "0%");
    $("#zip-log").text("");
    $("#zipModel").modal({ backdrop: "static", keyboard: false });
    const files = [];
    $(".checkbox-download:checked").each(function () {
        const el = $(this).parents(".card-link");
        files.push({ name: el.data("name"), file: el.data("href") });
    });

    $("#zip-log").append(
        "Downloading " + files.length + " files as ZIP..." + "\n"
    );

    // Start building a ZIP file
    const zip = new JSZip();

    const promises = [];
    let startedFiles = 0;
    let finishedFiles = 0;
    for (const file of files) {
        promises.push(
            fetch(file.file)
                .then(function (response) {
                    appendZipLog("Downloading " + file.name + "...");
                    startedFiles++;
                    updateZipProgress(
                        files.length,
                        startedFiles,
                        finishedFiles,
                        false
                    );
                    // 2) filter on 200 OK
                    if (response.status === 200 || response.status === 0) {
                        return Promise.resolve(response.blob());
                    } else {
                        return Promise.reject(new Error(response.statusText));
                    }
                })
                .then(function (blob) {
                    appendZipLog("Added " + file.name + " to zip");
                    zip.file(file.name, blob);
                    finishedFiles++;
                    updateZipProgress(
                        files.length,
                        startedFiles,
                        finishedFiles,
                        false
                    );
                })
        );
    }
    Promise.all(promises)
        .then(function () {
            updateZipProgress(files.length, files.length, files.length, true);
            appendZipLog("Compressing ZIP file...");
            return zip.generateAsync({ type: "blob" });
        })
        .then(function (blob) {
            appendZipLog("Downloading ZIP file...");
            saveAs(blob, "download-" + meta.model + ".zip");
            appendZipLog("Done");
            updateZipProgress(files.length, files.length, files.length, false);
            $("#zip-progress").css("width", 100 + "%");
            $("#zipModel").modal("hide");
        })
        .catch(function (err) {
            console.warn(err);
        });
});

function appendZipLog(message) {
    const el = $("#zip-log");
    el.append(message + "\n");
    el.scrollTop(el.prop("scrollHeight"));
}
function updateZipProgress(total, started, finished, compressing) {
    const percent = (started / total) * 0.45 + (finished / total) * 0.45;
    $("#zip-progress").css("width", percent * 100 + "%");
    if (compressing) {
        $("#zip-progress").addClass(
            "progress-bar-striped progress-bar-animated"
        );
    } else {
        $("#zip-progress").removeClass(
            "progress-bar-striped progress-bar-animated"
        );
    }
}