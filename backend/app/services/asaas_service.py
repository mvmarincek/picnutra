import httpx
import logging
from typing import Optional, Dict, Any
from app.core.config import settings

logger = logging.getLogger(__name__)

class AsaasError(Exception):
    def __init__(self, message: str, status_code: int = 0, response_body: str = "", endpoint: str = ""):
        self.message = message
        self.status_code = status_code
        self.response_body = response_body
        self.endpoint = endpoint
        super().__init__(self.message)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "message": self.message,
            "status_code": self.status_code,
            "response_body": self.response_body[:1000] if self.response_body else "",
            "endpoint": self.endpoint
        }

class AsaasService:
    def __init__(self):
        self.api_key = settings.ASAAS_API_KEY
        self.base_url = settings.ASAAS_BASE_URL
        self.headers = {
            "access_token": self.api_key,
            "Content-Type": "application/json"
        }
    
    def _handle_response(self, response: httpx.Response, endpoint: str) -> Dict[str, Any]:
        try:
            response_body = response.text
        except:
            response_body = ""
        
        if response.status_code >= 400:
            error_msg = f"Asaas API error: {response.status_code}"
            try:
                error_data = response.json()
                if "errors" in error_data:
                    errors = error_data["errors"]
                    if isinstance(errors, list) and len(errors) > 0:
                        error_msg = errors[0].get("description", error_msg)
                elif "message" in error_data:
                    error_msg = error_data["message"]
            except:
                pass
            
            logger.error(f"[Asaas] {endpoint} - Status: {response.status_code} - Response: {response_body[:500]}")
            raise AsaasError(
                message=error_msg,
                status_code=response.status_code,
                response_body=response_body,
                endpoint=endpoint
            )
        
        try:
            return response.json()
        except Exception as e:
            logger.error(f"[Asaas] {endpoint} - Failed to parse JSON: {response_body[:500]}")
            raise AsaasError(
                message=f"Failed to parse Asaas response: {str(e)}",
                status_code=response.status_code,
                response_body=response_body,
                endpoint=endpoint
            )
    
    async def create_customer(self, email: str, name: Optional[str] = None, cpf: Optional[str] = None) -> Dict[str, Any]:
        endpoint = "POST /customers"
        async with httpx.AsyncClient(timeout=30.0) as client:
            payload = {
                "name": name or email.split("@")[0],
                "email": email
            }
            if cpf:
                cpf_clean = cpf.replace(".", "").replace("-", "").replace("/", "")
                payload["cpfCnpj"] = cpf_clean
            
            logger.info(f"[Asaas] Creating customer: {email}")
            response = await client.post(
                f"{self.base_url}/customers",
                headers=self.headers,
                json=payload
            )
            return self._handle_response(response, endpoint)
    
    async def get_customer_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        endpoint = "GET /customers"
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{self.base_url}/customers",
                headers=self.headers,
                params={"email": email}
            )
            if response.status_code == 404:
                return None
            data = self._handle_response(response, endpoint)
            if data.get("data") and len(data["data"]) > 0:
                return data["data"][0]
            return None
    
    async def update_customer(self, customer_id: str, cpf: str) -> Dict[str, Any]:
        endpoint = f"PUT /customers/{customer_id}"
        async with httpx.AsyncClient(timeout=30.0) as client:
            cpf_clean = cpf.replace(".", "").replace("-", "").replace("/", "")
            response = await client.put(
                f"{self.base_url}/customers/{customer_id}",
                headers=self.headers,
                json={"cpfCnpj": cpf_clean}
            )
            return self._handle_response(response, endpoint)
    
    async def create_pix_payment(
        self,
        customer_id: str,
        value: float,
        description: str,
        external_reference: str
    ) -> Dict[str, Any]:
        endpoint = "POST /payments (PIX)"
        async with httpx.AsyncClient(timeout=30.0) as client:
            payload = {
                "customer": customer_id,
                "billingType": "PIX",
                "value": value,
                "dueDate": self._get_due_date(),
                "description": description,
                "externalReference": external_reference
            }
            logger.info(f"[Asaas] Creating PIX payment: customer={customer_id}, value={value}")
            response = await client.post(
                f"{self.base_url}/payments",
                headers=self.headers,
                json=payload
            )
            return self._handle_response(response, endpoint)
    
    async def create_credit_card_payment(
        self,
        customer_id: str,
        value: float,
        description: str,
        external_reference: str,
        card_holder_name: str,
        card_number: str,
        expiry_month: str,
        expiry_year: str,
        cvv: str,
        holder_cpf: str,
        holder_email: str,
        holder_phone: str,
        postal_code: str,
        address_number: str
    ) -> Dict[str, Any]:
        endpoint = "POST /payments (CREDIT_CARD)"
        async with httpx.AsyncClient(timeout=30.0) as client:
            cpf_clean = holder_cpf.replace(".", "").replace("-", "").replace("/", "")
            postal_clean = postal_code.replace("-", "").replace(".", "")
            phone_clean = holder_phone.replace("(", "").replace(")", "").replace("-", "").replace(" ", "")
            
            payload = {
                "customer": customer_id,
                "billingType": "CREDIT_CARD",
                "value": value,
                "dueDate": self._get_due_date(),
                "description": description,
                "externalReference": external_reference,
                "creditCard": {
                    "holderName": card_holder_name,
                    "number": card_number.replace(" ", ""),
                    "expiryMonth": expiry_month,
                    "expiryYear": expiry_year,
                    "ccv": cvv
                },
                "creditCardHolderInfo": {
                    "name": card_holder_name,
                    "email": holder_email,
                    "cpfCnpj": cpf_clean,
                    "postalCode": postal_clean,
                    "addressNumber": address_number,
                    "phone": phone_clean
                }
            }
            logger.info(f"[Asaas] Creating card payment: customer={customer_id}, value={value}")
            response = await client.post(
                f"{self.base_url}/payments",
                headers=self.headers,
                json=payload
            )
            return self._handle_response(response, endpoint)
    
    async def create_subscription(
        self,
        customer_id: str,
        value: float,
        billing_type: str,
        description: str,
        external_reference: str,
        cycle: str = "MONTHLY",
        card_data: Optional[Dict[str, Any]] = None,
        card_holder_info: Optional[Dict[str, Any]] = None,
        next_due_days: int = 30
    ) -> Dict[str, Any]:
        endpoint = f"POST /subscriptions ({billing_type})"
        async with httpx.AsyncClient(timeout=30.0) as client:
            payload = {
                "customer": customer_id,
                "billingType": billing_type,
                "value": value,
                "nextDueDate": self._get_due_date(next_due_days),
                "description": description,
                "externalReference": external_reference,
                "cycle": cycle
            }
            
            if billing_type == "CREDIT_CARD" and card_data and card_holder_info:
                payload["creditCard"] = card_data
                payload["creditCardHolderInfo"] = card_holder_info
            
            logger.info(f"[Asaas] Creating subscription: customer={customer_id}, value={value}, type={billing_type}")
            response = await client.post(
                f"{self.base_url}/subscriptions",
                headers=self.headers,
                json=payload
            )
            return self._handle_response(response, endpoint)
    
    async def cancel_subscription(self, subscription_id: str) -> Dict[str, Any]:
        endpoint = f"DELETE /subscriptions/{subscription_id}"
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.delete(
                f"{self.base_url}/subscriptions/{subscription_id}",
                headers=self.headers
            )
            return self._handle_response(response, endpoint)
    
    async def get_subscription(self, subscription_id: str) -> Dict[str, Any]:
        endpoint = f"GET /subscriptions/{subscription_id}"
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{self.base_url}/subscriptions/{subscription_id}",
                headers=self.headers
            )
            return self._handle_response(response, endpoint)
    
    async def get_subscription_payments(self, subscription_id: str) -> Dict[str, Any]:
        endpoint = f"GET /subscriptions/{subscription_id}/payments"
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{self.base_url}/subscriptions/{subscription_id}/payments",
                headers=self.headers
            )
            return self._handle_response(response, endpoint)
    
    async def get_pix_qr_code(self, payment_id: str) -> Dict[str, Any]:
        endpoint = f"GET /payments/{payment_id}/pixQrCode"
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{self.base_url}/payments/{payment_id}/pixQrCode",
                headers=self.headers
            )
            return self._handle_response(response, endpoint)
    
    async def get_payment(self, payment_id: str) -> Dict[str, Any]:
        endpoint = f"GET /payments/{payment_id}"
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{self.base_url}/payments/{payment_id}",
                headers=self.headers
            )
            return self._handle_response(response, endpoint)
    
    async def get_boleto_url(self, payment_id: str) -> str:
        payment = await self.get_payment(payment_id)
        return payment.get("bankSlipUrl", "")
    
    def _get_due_date(self, days: int = 1) -> str:
        from datetime import datetime, timedelta
        due_date = datetime.now() + timedelta(days=days)
        return due_date.strftime("%Y-%m-%d")

asaas_service = AsaasService()
