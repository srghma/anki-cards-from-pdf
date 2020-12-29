#!/usr/bin/env bash

#
# a small wrapper around the python script to avoid docker commands
#

# filename="Klein_2014_Learn German with stories"
# filepath="/home/srghma/Dropbox/zotfile/$filename.pdf"

ocrize() {
  filename="$1"
  filepath="/home/srghma/Downloads/$filename"

  echo "Doing $filename"

  docker run \
    -it \
    -v $HOME/Documents:/Documents \
    -v "$filepath":/myfile.pdf \
    -v $PWD/extract_pdf_notes.py:/usr/bin/extract_pdf_notes \
    --user $(id -u):$(id -u) \
    extract_pdf_notes \
    ocrmypdf -l jpn --deskew --output-type pdfa /myfile.pdf "/Documents/$filename"
}

ocrize 'Oxford Japanese Grammar and Verbs by Jonathan Bunt (z-lib.org).pdf'

# /usr/bin/extract_pdf_notes /myfile.pdf > /tmp/asdf

# sd 'ersu chen' 'versuchen' /tmp/asdf
# sd '"annotation_text": "erzählte"' '"annotation_text": "erzählen"' /tmp/asdf
# sd 'v<strong>ersu</strong>-<strong>chen</strong>' '<strong>versuchen</strong>' /tmp/asdf
# sd '"annotation_text": "geses"' '"annotation_text": "gesessen"' /tmp/asdf
# sd '<strong>geses-</strong>sen' '<strong>gesessen</strong>' /tmp/asdf
# sd '"annotation_text": "mochte"' '"annotation_text": "mögen"' /tmp/asdf
# sd '"annotation_text": "wusst"' '"annotation_text": "wissen"' /tmp/asdf
# sd '<strong>wusst</strong>e' '<strong>wusste</strong>' /tmp/asdf
# sd '"annotation_text": "zeigte"' '"annotation_text": "zeigen"' /tmp/asdf
# sd 'Blot-wosch' 'Blotwosch' /tmp/asdf
# sd 'Minu-ten' 'Minuten' /tmp/asdf
# sd '"annotation_text": "dritthöchste"' '"annotation_text": "dritt"' /tmp/asdf
# sd '<strong>dritthöchste</strong>' '<strong>dritthöchste (по высоте)</strong>' /tmp/asdf

# cat /tmp/asdf | jq 'unique_by(.annotation_text_id)' > /tmp/asdf2
# mv -f /tmp/asdf2 /tmp/asdf
# sd '"sentence": "\"Willst du ein <strong>biss-"' '"sentence": "\"Willst du ein <strong>bisschen</strong> <strong>spazieren</strong> gehen?\""' /tmp/asdf

# sd -s '{
#     "annotation_content": null,
#     "annotation_text": "bisschen",
#     "annotation_text_id": "bisschen",
#     "position": "Page 17 (2. Sechs Euro pro Nacht)",
#     "sentence": "\"Willst du ein <strong>biss-"
#   },
#   {
#     "annotation_content": null,
#     "annotation_text": "bisschen",
#     "annotation_text_id": "bisschen",
#     "position": "Page 17 (2. Sechs Euro pro Nacht)",
#     "sentence": "<strong>chen</strong> <strong>spazieren</strong> gehen?\""
#   },' 'Minuten' /tmp/asdf

# cat /tmp/asdf | jq 'sort_by(.annotation_text_id|ascii_downcase)'

  # --progress -o "/Documents/$filename-annotations.txt"

# input_file=${1}
# filename=$(basename "${1}")
# ext=${filename: -3}
# prefix=${filename%.${ext}}
# loc=$(readlink -nf "${input_file}")
# location=$(dirname "${loc}")

# function error(){
#     echo -e "\n*********************************************\n"
#     echo "ERROR: ${@}"
#     echo -e "\n*********************************************\n"
#     exit 1
# }

# docker --version >/dev/null
# if [[ $? -ne 0 ]]; then
#     error "Docker is not reachable - script may not work"
# fi

# [[ ! -e ${location}/${filename} ]] && error "${input_file} does not exist."

# mkdir -p "${location}/${prefix}_Notes" &>/dev/null

# # If script is able to create _Notes directory it'll write to it or will write to stdout without any PNG files
# if [[ -d "${location}/${prefix}_Notes" ]]; then

#     echo "Saving all the notes in ${location}/${prefix}_Notes"

#     touch "${location}/${prefix}_Notes/${prefix}.txt"
#     [[ $? -eq 0 ]] || error "Unable to write to directory ${location}/${prefix}_Notes"

#     cp "${input_file}" "${location}/${prefix}_Notes/"
#     docker run -v "${location}/${prefix}_Notes":/notes --user $(id -u):$(id -u)  \
#         vsukt/extract_pdf_notes:latest "${filename}" >"${location}/${prefix}_Notes/${prefix}.txt"
#     rm "${location}/${prefix}_Notes/${filename}"

# else
#     echo -e "Failed to create _Notes directory at ${location}. Sending all annotations to stdout\n Won't be able to create any PNG files\n\n"
#     docker run -v "${location}/":/notes --user $(id -u):$(id -u)  \
#         vsukt/extract_pdf_notes:latest "${filename}"
#     error "No images extracted - target location read-only"
# fi
