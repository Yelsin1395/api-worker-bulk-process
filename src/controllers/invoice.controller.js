export default class InvoiceController {
  constructor({ invoiceService }) {
    this._invoiceService = invoiceService;

    this.processMigrateInvoice = this.processMigrateInvoice.bind(this);
  }

  async processMigrateInvoice(req, res) {
    this._invoiceService.processMigrateInvoice();
    return res.status(200).send({
      status: 200,
      message: 'Data process migrate invoice',
    });
  }
}
