# container for easy use
FROM python:3

# ADD extract_pdf_notes.py /usr/bin/extract_pdf_notes
# chmod a+x /usr/bin/extract_pdf_notes && \
RUN pip install --no-cache-dir pdfminer.six beeprint
RUN pip install --no-cache-dir simplejson
RUN pip install --no-cache-dir ftfy
RUN pip install --no-cache-dir ocrmypdf

RUN apt-get update && apt-get install -y --no-install-recommends \
  libleptonica-dev \
  zlib1g-dev

RUN \
  mkdir jbig2 \
  && curl -L https://github.com/agl/jbig2enc/archive/ea6a40a.tar.gz | \
  tar xz -C jbig2 --strip-components=1 \
  && cd jbig2 \
  && ./autogen.sh && ./configure && make && make install \
  && cd .. \
  && rm -rf jbig2

RUN apt-get update && apt-get install -y --no-install-recommends \
  ghostscript \
  img2pdf \
  liblept5 \
  libsm6 libxext6 libxrender-dev \
  zlib1g \
  pngquant \
  python3 \
  qpdf \
  tesseract-ocr \
  tesseract-ocr-deu \
  tesseract-ocr-eng \
  tesseract-ocr-jpn \
  unpaper

  # tesseract-ocr-chi-sim \
  # tesseract-ocr-fra \
  # tesseract-ocr-por \
  # tesseract-ocr-spa \

# ENTRYPOINT ["/usr/bin/extract_pdf_notes"]
