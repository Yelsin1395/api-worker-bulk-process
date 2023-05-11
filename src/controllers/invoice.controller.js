export default class InvoiceController {
  constructor({ invoiceService }) {
    this._invoiceService = invoiceService;

    this.processCrossInvoice = this.processCrossInvoice.bind(this);
  }

  async processCrossInvoice(req, res) {
    this._invoiceService.processCrossInvoice();
    return res.status(200).send({
      status: 200,
      message: 'Data process cross invoice',
    });
  }
}
