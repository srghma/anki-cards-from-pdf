rm -f /home/srghma/html.zip
rm -f /home/srghma/Downloads/html.zip
rm -f /home/srghma/Downloads/collection.media.zip
rm -f /home/srghma/Downloads/anki-addon-glossary.zip

# cd '/home/srghma/.local/share/Anki2/User 1/collection.media/anki-addon-glossary/' && zip -r --temp-path /tmp/ /home/srghma/Downloads/anki-addon-glossary.zip .
cd '/home/srghma/.local/share/Anki2/User 1/collection.media/' && zip -r --temp-path /tmp/ /home/srghma/Downloads/collection.media.zip .
cd '/home/srghma/projects/anki-cards-from-pdf/fonts/' && zip -r --temp-path /tmp/ /home/srghma/Downloads/collection.media.zip .
cd '/home/srghma/projects/anki-cards-from-pdf/html/' && zip -r --temp-path /tmp/ /home/srghma/Downloads/collection.media.zip .
