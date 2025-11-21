from http.server import BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse
import qrcode
import io
import base64

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        query_comp = parse_qs(urlparse(self.path).query)
        url_to_encode = query_comp.get('url', [None])[0]
        if not url_to_encode:
            self.send_response(400)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write("No URL Given so Fuck off".encode())
            return
        
        qr = qrcode.QRCode(
            version = 1,
            error_correction=qrcode.constants.ERROR_CORRECT_H,
            box_size = 10,
            border = 4
            )
        qr.add_data(url_to_encode)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white") #create
        #save
        img_byte_a = io.BytesIO()
        img.save(img_byte_a, format = 'PNG')
        img_byte_a = img_byte_a.getvalue()
        #send
        self.send_response(200)
        self.send_header('Content-type', 'image/png')
        self.end_headers()
        #write img to resp
        self.wfile.write(img_byte_a)
        return

