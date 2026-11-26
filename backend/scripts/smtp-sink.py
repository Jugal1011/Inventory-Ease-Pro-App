import asyncio, email, json, sys
from aiosmtpd.controller import Controller
class Sink:
    def __init__(self): self.msgs=[]
    async def handle_DATA(self, server, session, envelope):
        m = email.message_from_bytes(envelope.content)
        self.msgs.append({"from":envelope.mail_from,"to":envelope.rcpt_tos,"subject":m["Subject"],"reply_to":m["Reply-To"],"text":next((p.get_payload(decode=True).decode() for p in m.walk() if p.get_content_type()=="text/plain"),"")})
        with open("/tmp/inbox.json","w") as f: json.dump(self.msgs,f,indent=1)
        return "250 OK"
c = Controller(Sink(), hostname="127.0.0.1", port=2525)
c.start(); print("sink up", flush=True)
import time
while True: time.sleep(1)
