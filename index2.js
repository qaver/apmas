
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
 
const { Database } = require("@sqlitecloud/drivers");
const connectionString = "sqlitecloud://ccdw2ffidk.g6.sqlite.cloud:8860/AptAccounts.db?apikey=zicL36Va39puWbQs25FTr1PVyKlAGf4RyhbXJTGRtaY"

///To open a database connection to an in-memory SQLite database, you pass the 
///literal string ‘:memory:' to the Database constructor:
///const db = new sqli te3.Database(':memory:');
const app = express();

app.use(cors());

// cd D:\JsServer\Sqllite3\apartment
//D:\AkronData\MyProjects\Misc4\ApartAccounts\ApartAccounts

///app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
const enumError ={INVALIDACCOUNTNO:-19983};
class  MasterInfo{
  constructor(Id,Code,Name,Tenant,Email,PhoneNo,AcType,ParentName,Address1,Address2,Address3){
    this.Id = Id;
    this.Code = Code;
    this.Name = Name;
    this.Tenant = Tenant;
    this.Email = Email;
    this.PhoneNo = PhoneNo;
    this.AcType = AcType;
    this.ParentName = ParentName;
    this.Address1 = Address1;
    this.Address2 = Address2;
    this.Address3 = Address3;


  }
}
 function GetDateFilter(sDate,bfromDate)
 {
    /*if (bfromDate)
      return "'1998-01-01'";
      
    return  "'2026-01-01'";*/
    return  "'"+sDate +"'";
 }
function IsValidCodeOrName(text,ErrMsg)
{
     text = text.toLocaleLowerCase();
    // if ((text === 'Accounts') ||(text === 'General')||(text === 'Debtor')||(text === 'Creditor')||(text === 'Income')||(text === 'Expense')||(text === 'PettyCash')||(text === 'Cash')||(text === 'Bank'))
    if ((text === 'accounts') ||(text === 'general')||(text === 'debtor')||(text === 'creditor')||(text === 'income')||(text === 'expense')||(text === 'pettycash')||(text === 'cash')||(text === 'bank'))
     {
           ErrMsg.Error = "(Accounts,General,Debtor,Creditor,Income,Expense,PettyCash,Cash,Bank)";
	        return false;
     }
     return true;
}
function IsValidAccountType(text,ErrMsg)
{
   ///text = text.toLocaleLowerCase();
    // if ((text === 'accounts') ||(text === 'general')||(text === 'debtor')||(text === 'creditor')||(text === 'income')||(text === 'expense')||(text === 'pettycash')||(text === 'cash')||(text === 'bank'))
     if ((text === 'Accounts') ||(text === 'General')||(text === 'Debtor')||(text === 'Creditor')||(text === 'Income')||(text === 'Expense')||(text === 'PettyCash')||(text === 'Cash')||(text === 'Bank'))
     {   
	        return true;
     }
    ErrMsg.Error = "(General,Debtor,Creditor,Income,Expense,PettyCash,Cash,Bank)";
    return false;
}
function IsReservedAccount(Id,ErrMsg)
{
     if (Id < 18)
     {   
	  return true;
     }
     return false;
}

function runAsync(db,sql, params,errMsg) 
{
   return new Promise((resolve, reject) => 
  {
      db.run(sql, params, function(err)
      {
          if (err) 
          {
           /// con sole.log(err);
            reject(err);
          } 
          else 
          {
            // Capture `this` context for lastID and changes
            resolve(this);
          }
      });
  });
}
// A function that wraps db.all in a Promise
function getData(database,stmt) {
  return new Promise((resolve, reject) => {
    database.all(stmt, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}
async function IsDuplicateCodeOrName(db,Id,value,bCalledForCode,msg) 
{
  let sqlText = `Select Id From Mast1 Where (Id <>  ${Id}) And (Code= '${value}')`
  if (!bCalledForCode)
     sqlText = `Select Id From Mast1 Where (Id <>  ${Id}) And (Name= '${value}')`
  
  
  const rows = await getData(db,sqlText);
 /// con sole.log("rows ddd",rows+" sdf ",rows.length);
  if(!rows)
    return false;
  if (rows.length > 0)
  {
	return true;
  }
  return false;
}
async function IsVoucherPresent(db,voucherNo,msg) 
{
  let sqlText = `Select VoucherNo From FAccounting nolock Where(VoucherNo = '${voucherNo}')`
  ///con sole.log(sqlText);
  const rows = await getData(db,sqlText);
  if(!rows)
    return false;
  if (rows.length > 0)
  {
	  return true;
  }
  return false;
}
async function GetAccountNo(db,name) 
{
  let sqlText = `Select Id From Mast1 nolock Where   (Name= '${name}')`
  const rows = await getData(db,sqlText);
 
  if(!rows)
    return -155;
  if (rows.length > 0)
  {
	    return rows[0].Id;
  }
  return enumError.INVALIDACCOUNTNO;
}
async function UpdateAccount(db,account,errMsg) 
{
  try 
  {
    let bDuplicate = false;
    if(await IsDuplicateCodeOrName(db,account.Id,account.Code,true))
    {
	    errMsg.Error = "Duplicate Code";
	    bDuplicate = true;
    }
    else if(await IsDuplicateCodeOrName(db,account.Id,account.Name,false))
    {
	    errMsg.Error = "Duplicate Name";
	    bDuplicate = true;
    }   
    if (bDuplicate)
    {
      return false;
    }

    await runAsync(db,'BEGIN TRANSACTION');

    const updateSql = 'UPDATE Mast1 SET Code = ?,Name = ?, Tenant = ? ,Email= ?,PhoneNo=?, AcType = ?,ParentName= ?, Address1 = ? ,Address2 = ?, Address3 = ?  WHERE Id = ?';
    const result = await runAsync(db,updateSql, [account.Code,account.Name,account.Tenant,account.Email,account.PhoneNo,account.AcType,account.ParentName,account.Address1,account.Address2,account.Address3,account.Id]);
   
   // con sole.log(result);
    if (result.changes === 0) 
    {
       errMsg.Error = `Account with Id = ${account.Id} not found.`;
       return false;
    }

    // A simulated error to test the rollback functionality
    //  throw new Error("Simulating a failure");

    await runAsync(db,'COMMIT');
    ///con sole.log(`Account updated to ${account}.`);
    return true;
  } 
  catch (err) 
  {
    await runAsync(db,'ROLLBACK');
    errMsg.Error = `Update Accounts for (Code = ${account.Code},Name = ${account.Name}) failed: ${err.message}..`;
    //con sole.log(errMsg);
    return false;
  }
}
async function AddAccount(db,account,errMsg) 
{
  try 
  {
    let bDuplicate = false;
    if(await IsDuplicateCodeOrName(db,-155,account.Code,true))
    {
	      errMsg.Error = "Duplicate Code";
	      bDuplicate = true;
    }
    else if(await IsDuplicateCodeOrName(db,-155,account.Name,false))
    {
	      errMsg.Error = "Duplicate Name";
	      bDuplicate = true;
    }   
    if (bDuplicate)
    {
      return false;
    }
	
    await runAsync(db,'BEGIN TRANSACTION');
	
    const updateSql = 'Insert Into Mast1 Values((select Max(Id)+1 from mast1),?,?,?,?,?,?,?,?,?,?,?)';
    const result = await runAsync(db,updateSql, [account.Code,account.Name,account.Tenant,"",account.Email,account.PhoneNo,account.AcType,account.ParentName,account.Address1,account.Address2,account.Address3]);
   
    ///con sole.log(result);
    if (result.changes === 0) 
    {
       errMsg.Error = `Account not added.`;
       return false;
    }

    // A simulated error to test the rollback functionality
    //  throw new Error("Simulating a failure");

    await runAsync(db,'COMMIT');
    ///con sole.log(`Account Added to ${account}.`);
    return true;
  } 
  catch (err) 
  {
    await runAsync(db,'ROLLBACK');
   /// errMsg.Error = `Add Accounts for (Code = ${account.Code},Name = ${account.Name}) failed: ${err.message}..`;
    ///con sole.log(errMsg);
    return false;
  }
}
async function addTransaction(db,transactions,forEditing,errMsg) 
{
  try 
  { 
    let voucherNo = transactions[0].VoucherNo;
    let bPresent = await IsVoucherPresent(db,voucherNo);
    if (forEditing)
    {
        if (!bPresent)
        {
            errMsg.Error = "Voucher doesn't exists.";
            return false;
        }
    }
    else
    {
        if (bPresent)
        {
            errMsg.Error = "Voucher already exists.";
            return false;
        }
    }

    await runAsync(db,'BEGIN TRANSACTION');
	  
    if (forEditing)
    {
        let deleteStmt = `Delete From FAccounting Where (VoucherNo = '${voucherNo}')`
        const result = await runAsync(db,deleteStmt);
       // con sole.log(deleteStmt);
    }
    let voucherDate = transactions[0].VoucherDate;
    let headerAccountName = transactions[0].Account2_Name;
    let dueDate = transactions[0].DueDate;
    let narration = transactions[0].Narration;
    let chequeNo = transactions[0].ChequeNo;

    let headerAccountNo = await GetAccountNo(db,headerAccountName);
    if (headerAccountNo == enumError.INVALIDACCOUNTNO)
    {
       errMsg.Error = 'Error:Invalid payment/reciept mode.';
      throw errMsg;
    }
   // con sole.log("here1");
    for (let i = 0;i < transactions.length;++i)
    {
      let SNo = transactions[i].SNo;
      let bodyAccountName = transactions[i].Account1_Name;
      let amount = transactions[i].Amount;
      let lNarration = transactions[i].LNarration;
      let trType = transactions[i].TRType;

      let bodyAccountNo = await GetAccountNo(db,bodyAccountName);
      if (bodyAccountNo == enumError.INVALIDACCOUNTNO)
      {
          errMsg.Error  = "Invalid account at row "+SNo + ". ";
         throw errMsg;
      }
      let account1No =  bodyAccountNo;
      let account2No = headerAccountNo;
      if (voucherNo.startsWith("RCV-")) // payment
      {
        account1No = headerAccountNo;
        account2No = bodyAccountNo;
      }
      else if ((voucherNo.startsWith("OPN-")) ||(voucherNo.startsWith("JRV-")) ||(voucherNo.startsWith("DRV-"))||(voucherNo.startsWith("CRV-")))
      {
          if(trType.toLowerCase() === 'cr')
          {
            account1No = headerAccountNo;
            account2No = bodyAccountNo;
          }
      }
      
     // const stmt = `Insert Into FAccounting Values('${voucherNo}'${SNo},${account1No},'${voucherDate}','${dueDate}','${narration}',${account2No},${amount},'${trType}','${lNarration}','${chequeNo}'`
     stmt = `Insert Into FAccounting Values(?,?,?,?,?,?,?,?,?,?,?)`;
      const result = await runAsync(db,stmt, [voucherNo,SNo,account1No,voucherDate,dueDate,narration,account2No,amount,trType,lNarration,chequeNo]);
     // con sole.log(stmt);
    }
    //con sole.log("tt2");
      //const updateSql = 'Insert Into Mast1 Values((select Max(Id)+1 from mast1),?,?,?,?,?,?,?,?,?,?,?)';
    ///const result = await runAsync(db,updateSql, [account.Code,account.Name,account.Tenant,"",account.Email,account.PhoneNo,account.AcType,account.ParentName,account.Address1,account.Address2,account.Address3]);
   
    ///con sole.log(result);
 //   if (result.changes === 0) 
  ///  {
  / ///    errMsg.Error = `Account not added.`;
   //    return false;
   // }

    // A simulated error to test the rollback functionality
    //  throw new Error("Simulating a failure");

    await runAsync(db,'COMMIT');
    ///con sole.log(`Account Added to ${account}.`);
    return true;
  } 
  catch (err) 
  {
    await runAsync(db,'ROLLBACK');
     console.log("rollback",err);
   /// errMsg.Error = `Add Accounts for (Code = ${account.Code},Name = ${account.Name}) failed: ${err.message}..`;
    ///con sole.log(errMsg);
    return false;
  }
}
async function deleteTransaction(db,voucherNo,errMsg) 
{
  try 
  { 
    let bPresent = await IsVoucherPresent(db,voucherNo);
    if (!bPresent)
    {
          errMsg.Error = "voucher dosent exists.";
          return false;
    }
    
    await runAsync(db,'BEGIN TRANSACTION');
	  
    let deleteStmt = `Delete From FAccounting Where (VoucherNo = '${voucherNo}')`
    const result = await runAsync(db,deleteStmt);
   // con sole.log(deleteStmt);
     

    // A simulated error to test the rollback functionality
    //  throw new Error("Simulating a failure");

    await runAsync(db,'COMMIT');
    ///con sole.log(`Account Added to ${account}.`);
    return true;
  } 
  catch (err) 
  {
    await runAsync(db,'ROLLBACK');
     console.log("rollback",err) ;
   /// errMsg.Error = `Add Accounts for (Code = ${account.Code},Name = ${account.Name}) failed: ${err.message}..`;
    ///con sole.log(errMsg);
    return false;
  }
}
async function DeleteAccount(db,Id,errMsg) 
{
  try 
  {
     
    await runAsync(db,'BEGIN TRANSACTION');

    const updateSql = 'Delete From Mast1  WHERE Id = ?';
    const result = await runAsync(db,updateSql, [Id]);
   
    if (result.changes === 0) 
    {
       errMsg.Error = `Account with Id = ${Id} not found.`;
       return false;
    }

    // A simulated error to test the rollback functionality
    //  throw new Error("Simulating a failure");

    await runAsync(db,'COMMIT');
    ///con sole.log(`Account deleted to ${Id}.`);
    return true;
  } 
  catch (err) 
  {
    await runAsync(db,'ROLLBACK');
    errMsg.Error = `Delete Accounts for (Id = ${Id}) failed: ${err.message}..`;
    //con sole.log(errMsg);
    return false;
  }
}


//http://localhost:3000/api/data/account/Name/Flat101
app.get('/api/data/test1/', async (req, res) => 
{
   let account = {Id:1,Code:"",Name:""};
  let db = null;
 try {

     if (!req.body.Code)
     {
        return res.status(400).send({Id:-155,Name:'code is required'});
     }
      
      let Code = req.body.Code;

      if (!req.body.Name)
      {
            return res.status(400).send({Id:-155,Name:'name is required'});
      }
      
      let Name = req.body.Name;
     account = {Id:1,Code:Code,Name:Name};
}	
catch (err) 
{
    console.error("Error fetching html parameters :", err.message);
} 

db = new Database(connectionString)
 let bError =false;
try
{
    await runAsync(db,'BEGIN TRANSACTION'); 
   
   
   //cons ole.log("val this one" + await IsDuplicateCodeOrName(db,account.Id,account.Name,false));
   //con sole.log(" berfor");
    let returnValue =  await IsDuplicateCodeOrName(db,account.Id,account.Code,true);
 //con sole.log(" afgter");

   // con sole.log(" code ret value = ",returnValue );
    if(returnValue)
    {
	Name = "Duplicate Code";
	bError = true;
	//con sole.log("duplicate code found");

    }
    else if( IsDuplicateCodeOrName(db,account.Id,account.Name,false))
    {
	Name = "Duplicate Name";
	bError = true;
	//con sole.log("duplicate name found");
    }
   
  
}
catch (err) 
{
    console.error("Error fetching account:", err.message);
} 
finally 
{
    db?.close();
}
  if (bError)
	  return res.status(400).send({Id:-155,Name:Name});
	
  return res.status(200).send({Id:-155,Name:'success'});
});
app.put('/api/data/account/edit', async (req, res) =>
{
   let db = null;
  try 
  {
     ///con sole.log(req.body);
     if (!req.body.Id)
     {
        return res.status(200).send({Id:-155,Name:'id is required.'});
     }
     let Id = req.body.Id;
     if (!req.body.Code)
     {
        return res.status(200).send({Id:-155,Name:'code is required.'});
     }
      
      let Code = req.body.Code;

      if (!req.body.Name)
      {
            return res.status(200).send({Id:-155,Name:'name is required.'});
      }
      
      let Name = req.body.Name;
      let ErrMsg = {"Error":""};
      if (!IsValidCodeOrName(Code,ErrMsg))
      {
            return res.status(200).send({Id:-155,Name:"Reserved account Code." +ErrMsg.Error});
      }
      if (!IsValidCodeOrName(Name,ErrMsg))
      {
            return res.status(200).send({Id:-155,Name:"Reserved account Name." +ErrMsg.Error});

      }

      if (!req.body.AcType)
      {
            return res.status(200).send({Id:-155,Name:'AccountType is required.'});
      }
      let AcType = req.body.AcType;
      if (!IsValidAccountType(AcType,ErrMsg))
      {
            return res.status(200).send({Id:-155,Name:`Invalid Account Type(${AcType}).` +ErrMsg.Error});

      }
      if (!req.body.ParentName)
      {
            return res.status(200).send({Id:-155,Name:'Parent Name is required'});
      }
      let ParentName = req.body.ParentName;
	
     let Tenant = "";
     if (req.body.Tenant)
	      Tenant 	= req.body.Tenant
 
     let Email = "";
     if (req.body.Email)
	      Email 	= req.body.Email
     
    let PhoneNo = "";
     if (req.body.PhoneNo)
	      PhoneNo = req.body.PhoneNo

    let Address1 = "";
    let Address2 = "";
    let Address3 = "";

     if (req.body.Address1)
	      Address1 = req.body.Address1

     if (req.body.Address2)
	      Address2 = req.body.Address2

     if (req.body.Address3)
	      Address3 = req.body.Address3;


    // con sole.log(Code,Name,AcType,ParentName,Tenant,PhoneNo,Address1,Address2,Address3);
     db = new Database(connectionString)
    
     //let account = {"Id":18,"Name":"Flat101","Code":"Flat101","Tenant":"c","Email":"a","PhoneNo":"b","AcType":"Debtor","ParentName":"Debtor","Address1":"d","Address2":"e","Address3":"f"};
     let account = {"Id":Id,"Name":Name,"Code":Code,"Tenant":Tenant,"Email":Email,"PhoneNo":PhoneNo,"AcType":AcType,"ParentName":ParentName,"Address1":Address1,"Address2":Address2,"Address3":Address3};

     let bReturnValue = await UpdateAccount(db,account,ErrMsg);

     
     if (!bReturnValue)
     {
	     /// cons ole.log(ErrMsg);
	      res.status(200).send({Id:-155,Name:ErrMsg.Error}); 
     }
     else 
        res.status(200).send({Id:Id,Name:Name});
    }
    catch (err)
    {
        ///con sole.error(err);
        res.status(500).send({Id:-155,Name:'EditAccount:Server Error'});
    }
    finally 
    {
      db?.close();
    }
});
 app.put('/api/data/account/add', async (req, res) =>
{
  let db = null;
  try 
  {
     ///con sole.log(req.body);
     
     let Id = -155;
     if (!req.body.Code)
     {
        return res.status(400).send({Id:-155,Name:'code is required.'});
     }
      
      let Code = req.body.Code;

      if (!req.body.Name)
      {
            return res.status(400).send({Id:-155,Name:'name is required.'});
      }
      
      let Name = req.body.Name;
      let ErrMsg = {"Error":""};
      if (!IsValidCodeOrName(Code,ErrMsg))
      {
            return res.status(400).send({Id:-155,Name:"Error:Reserved account Code." +ErrMsg.Error});
      }
      if (!IsValidCodeOrName(Name,ErrMsg))
      {
            return res.status(400).send({Id:-155,Name:"Error:Reserved account Name." +ErrMsg.Error});

      }
      if (!req.body.AcType)
      {
            return res.status(400).send({Id:-155,Name:'AccountType is required.'});
      }
      let AcType = req.body.AcType;
      if (!IsValidAccountType(AcType,ErrMsg))
      {
             return res.status(400).send({Id:-155,Name:`Invalid Account Type(${AcType}).` +ErrMsg.Error});

      }
      if (!req.body.ParentName)
      {
            return res.status(400).send({Id:-155,Name:'Parent Name is required.'});
      }
      let ParentName = req.body.ParentName;
	
     let Tenant = "";
     if (req.body.Tenant)
	      Tenant 	= req.body.Tenant
 
     let Email = "";
     if (req.body.Email)
	      Email 	= req.body.Email
     
    let PhoneNo = "";
    if (req.body.PhoneNo)
	      PhoneNo = req.body.PhoneNo

    let Address1 = "";
    let Address2 = "";
    let Address3 = "";

     if (req.body.Address1)
	      Address1 = req.body.Address1

     if (req.body.Address2)
	      Address2 = req.body.Address2

     if (req.body.Address3)
	      Address3 = req.body.Address3;


    // con sole.log(Code,Name,AcType,ParentName,Tenant,PhoneNo,Address1,Address2,Address3);
     db = new Database(connectionString)
     //let account = {"Id":18,"Name":"Flat101","Code":"Flat101","Tenant":"c","Email":"a","PhoneNo":"b","AcType":"Debtor","ParentName":"Debtor","Address1":"d","Address2":"e","Address3":"f"};
     let account = {"Id":Id,"Name":Name,"Code":Code,"Tenant":Tenant,"Email":Email,"PhoneNo":PhoneNo,"AcType":AcType,"ParentName":ParentName,"Address1":Address1,"Address2":Address2,"Address3":Address3};

     let bReturnValue = await AddAccount(db,account,ErrMsg);
     if (!bReturnValue)
     {
	        ///con sole.log(ErrMsg);
	        res.status(200).send({Id:-155,Name:ErrMsg.Error}); 
     }
     else 
        res.status(200).send({Id:0,Name:"Success."});
    }
    catch (err) 
    {
      //con sole.error(err);
      res.status(500).send({Id:-155,Name:'Add Account:Server Error.'});
    }
     finally 
     {
        db?.close();
     }
  });
app.delete('/api/data/account/delete', async (req, res) =>
{
   let db = null;
  try 
  {
     if (!req.body.Id)
     {
        return res.status(400).send({Id:-155,Name:'id is required.'});
     }
     let Id = req.body.Id;

     let ErrMsg = {"Error":""};
     if (IsReservedAccount(Id,ErrMsg))
     {
            return res.status(200).send({Id:-155,Name:"Reserved account."});
     }

     
    db = new Database(connectionString)
     
     let bReturnValue = await DeleteAccount(db,Id,ErrMsg);

      
     if (!bReturnValue)
     {
	      ///con sole.log(ErrMsg);
	      res.status(200).send({Id:-155,Name:ErrMsg.Error}); 
     }
     else 
        res.status(200).send({Id:Id,Name:"Deleted."});
    }
    catch (err) 
    {
      ///cons ole.error(err);
      res.status(500).send({Id:-155,Name:'Delete account:Server Error.'});
    }
    finally 
    {
       db?.close();
    }
  });

//http://localhost:3000/api/data/account/Name/Flat101
app.get('/api/data/account/:fieldName/:fieldValue', async (req, res) => {
  let db = null;
  try 
  {
      if (!req.params.fieldName)
      {
        return res.status(400).send({Id:-155,Name:'fieldName is required.',arabic_Name:"",type:-100,levelNo:0,level1:0,level2:0,level3:0,level4:0,level5:0,level6:0,level7:0,level8:0});
      }
      if (!req.params.fieldValue)
      {
        return res.status(400).send({Id:-155,Name:'fieldValue is required.',arabic_Name:"",type:-100,levelNo:0,level1:0,level2:0,level3:0,level4:0,level5:0,level6:0,level7:0,level8:0});
      }

      let fieldName = req.params.fieldName;
      let fieldValue = req.params.fieldValue;
      fieldName = fieldName.toLocaleLowerCase();
      let bGetAll = false;
      if(fieldValue == "all")
        bGetAll = true;

      let bGetAllPositive = false;
      if(fieldValue == "positive")
        bGetAllPositive = true;

    
      if((fieldName == "name") ||(fieldName == "code"))
          fieldValue = "'" + fieldValue + "'";
      else if (fieldName != "id")
      {
        return  res.status(200).send({Id:-155,Name:'Fieldname can contain only name/code/id.',arabic_Name:"",type:-100,levelNo:0,level1:0,level2:0,level3:0,level4:0,level5:0,level6:0,level7:0,level8:0});
      }
    
  ///
    const  db = new Database(connectionString);
   
    let stmt = `SELECT  Id,Name,Code,Tenant,Email,PhoneNo,AcType,ParentName,Address1,Address2,Address3  FROM Mast1 Where ${fieldName} = ${fieldValue}`;
      if(bGetAll)
        stmt = `SELECT  Id,Name,Code,Tenant,Email,PhoneNo,AcType,ParentName,Address1,Address2,Address3  FROM Mast1 order by id`;
      else if(bGetAllPositive)
        stmt = `SELECT  Id,Name,Code,Tenant,Email,PhoneNo,AcType,ParentName,Address1,Address2,Address3  FROM Mast1 where id >= 0 order by id`;

    db.all(stmt, (err, rows) => 
    {
        if (err) 
        {
          console.log("unable to get account data.");
          throw err;
        }
    let count = 0
    res.json(rows);
  });
  
  return;
} 
catch (err)
{
    ///con sole.error(err);
    res.status(500).send({Id:-155,Name:'GetAccount:Server Error.'+err.message});
}
finally 
{
    db?.close();
}
});
app.get('/api/data/transaction/:voucherno', async (req, res) => {
  let db = null;
  try 
  {
      if (!req.params.voucherno)
      {
        return res.status(400).send({Id:-155,VoucherNo:'Voucherno is required.'});
      }
     
      let voucherNo = req.params.voucherno;
      let sStmt = "Select VoucherNo,SNo,"
          
      sStmt += "Case substr(VoucherNo,0,5) When 'PAV-' Then accDr.Name When 'RCV-' Then  accCr.Name Else (CASE TRType  WHEN 'Cr' THEN accCr.Name else accDr.Name  end ) End  Account1_Name ,";
      sStmt += "STRFTIME('%d/%m/%Y', VoucherDate) VoucherDate,STRFTIME('%d/%m/%Y', DueDate) DueDate,Narration,";
      sStmt += "Case substr(VoucherNo,0,5) When 'PAV-' Then accCr.Name When 'RCV-' Then  accDr.Name Else (CASE TRType  WHEN 'Cr' THEN accDr.Name  else accCr.Name end ) End Account2_Name,";
      sStmt += `Amount,TrType,LNarration,ChequeNo From FAccounting,Mast1 accDr,Mast1 accCr Where VoucherNo = '${voucherNo}' And accDr.Id = AccountDr And accCr.Id = AccountCr Order by SNo`;
     
      //con sole.log(sStmt);
    
    
    db = new Database(connectionString)
    db.all(sStmt, (err, rows) => 
    {
        if (err) 
        {
          console.log("unable to fetch data.");
          throw err;
        }
    let count = 0
    res.json(rows);
  });
  return;
} 
catch (err)
{
    ///con sole.error(err);
    res.status(500).send({Id:-155,Name:'Get Voucher:Server Error.'+err.message});
}
finally 
{
    db?.close();
}
});
app.get('/api/data/transaction/accounts/:voucherprefix/:accounttype', async (req, res) => {
  let db = null;
  try 
  {
      if (!req.params.voucherprefix)
      {
        return res.status(200).send({Id:-155,VoucherNo:'Voucher prefix is required.'});
      }
      if (!req.params.accounttype)
      {
        return res.status(200).send({Id:-155,VoucherNo:'account1/account2/reportAccounts is required.'});
      }
     
      let voucherprefix = req.params.voucherprefix;
      let accounttype = req.params.accounttype;
      const enumAccountType = {GENERAL:'General',DEBTOR:'Debtor',CREDITOR:'Creditor',INCOME:'Income',EXPENSE:'Expense',PETTYCASH:'PettyCash',CASH:'Cash',BANK:'Bank'};
      let sStmt = ''
      if  (accounttype.toLowerCase() === "account1")
      {
         if (voucherprefix === "RCV-")
          sStmt = `Select Code,Name,acType From Mast1 Where  (ID > 9) And (AcType = '${enumAccountType.GENERAL}' OR  AcType = '${enumAccountType.DEBTOR}'  OR AcType = '${enumAccountType.INCOME}' OR AcType = '${enumAccountType.EXPENSE}')`;
        else if (voucherprefix === "PAV-" )
          sStmt = `Select Code,Name,acType From Mast1 Where  (ID > 9) And (AcType = '${enumAccountType.GENERAL}' OR  AcType = '${enumAccountType.CREDITOR}'  OR AcType = '${enumAccountType.INCOME}' OR AcType = '${enumAccountType.EXPENSE}')`;
        else
          sStmt = `Select Code,Name,acType From Mast1 Where  (ID > 9)`;

      }
      else if (accounttype.toLowerCase() === "account2")
      {
        if ((voucherprefix.startsWith("RCV-")) ||(voucherprefix.startsWith("PAV-")))
          sStmt = `Select Code,Name,acType From Mast1 Where  (ID > 9) And (AcType = '${enumAccountType.GENERAL}' OR  AcType = '${enumAccountType.CASH}'  OR AcType =  '${enumAccountType.PETTYCASH}' OR AcType = '${enumAccountType.BANK}')`;
        else if (voucherprefix === "JRV-")
          sStmt = `Select Code,Name,acType From Mast1 Where  (Id = -450)`; // JV ACCOUNT
        else if (voucherprefix === "DRV-")
          sStmt = `Select Code,Name,acType From Mast1 Where  (Id = -400)`; // DEBIT NOTE ACCOUNT
        else if (voucherprefix === "CRV-" )
          sStmt = `Select Code,Name,acType From Mast1 Where  (Id = -350)`; // CREDIT NOTE ACCOUNT
        else if (voucherprefix === "OPN-")
          sStmt = `Select Code,Name,acType From Mast1 Where  (Id = -500)`; // Opening ACCOUNT
        else 
          return res.status(400).send({Id:-155,VoucherNo:'Invalid voucher type.'});
      }
       else if (accounttype.toLowerCase() === "reportaccounts")
      {
        sStmt = `Select Code,Name,acType From Mast1 Where  (ParentName = '${voucherprefix}')`; // Opening ACCOUNT
      }
      else 
        return res.status(400).send({Id:-155,VoucherNo:'Invalid account1/account2/reportAccounts(2).'});

    //con sole.log(sStmt);
     db = new Database(connectionString)
    
     
    db.all(sStmt, (err, rows) => 
    {
        if (err) 
        {
          console.log("unable to fetch data.");
          throw err;
        }
    let count = 0
    res.json(rows);
  });
  
  
  return;
	

    ///if (result.rowsAffected <= 0)
   /// {
     // res.status(200).send({NodeNo:-155,Name:`${masterName} not found.`,Code_Name:"",Tenant:"",Email:"",PhoneNo:"",AcType:"",ParentName:"",Address1:"",Address2:"",Address3:""});
     
   /// }
    //res.json(result.recordset);
   /// return;
} 
catch (err)
{
    ///con sole.error(err);
    res.status(500).send({Id:-155,Name:'GetAccount:Server Error.'+err.message});
}
finally 
{
    db?.close();
}
});
app.put('/api/data/transaction/add', async (req, res) =>
{
   let db = null;
  try 
 {
     ///con sole.log(req.body);
       const transactions = req.body;
      
        if (!Array.isArray(transactions)) 
        {
           return  res.status(400).json({ Id:-155,errMsg: 'Invalid request body: expected an array' });
        }
        
        if(transactions.length <= 0)
          return   res.status(400).json({ Id:-155,errMsg: 'Error:Cant save Blank data.' });
       
     db = new Database(connectionString)
     let ErrMsg = {"Error":""};
     let bReturnValue = await addTransaction(db,transactions,false,ErrMsg);
     if (!bReturnValue)
     {
	      //  con sole.log(ErrMsg);
	        res.status(200).send({Id:-155,errMsg:ErrMsg.Error}); 
     }
     else 
        res.status(200).send({Id:0,errMsg:"Success."});
    }
    catch (err) 
    {
      //con sole.error(err);
      res.status(500).send({Id:-155,errMsg:'Add voucher:Server Error.'});
    }
    finally 
    {
      db?.close();
    }
  });
  
app.put('/api/data/transaction/edit', async (req, res) =>
{
  let db = null;
 try 
 {
     ///con sole.log(req.body);
       const transactions = req.body;
      
        if (!Array.isArray(transactions)) 
        {
           return  res.status(400).json({ Id:-155,errMsg: 'Invalid request body: expected an array' });
        }
        
        if(transactions.length <= 0)
          return   res.status(400).json({ Id:-155,errMsg: 'Error:Cant save Blank data.' });
       
      db = new Database(connectionString)
     // con sole.log("  c2");
      let ErrMsg = {"Error":""};
     let bReturnValue = await addTransaction(db,transactions,true,ErrMsg);
    //con sole.log("  c3",bReturnValue);
     
     if (!bReturnValue)
     {
	        console.log(ErrMsg);
	        res.status(200).send({Id:-155,errMsg:ErrMsg.Error}); 
     }
     else 
        res.status(200).send({Id:0,errMsg:"Success."});
    }
    catch (err) 
    {
      //con sole.error(err);
      res.status(500).send({Id:-155,errMsg:'Edit voucher:Server Error.'});
    }
    finally
    {
      db?.close();
    }
  });
  app.delete('/api/data/transaction/delete/:voucherNo', async (req, res) =>
  {
    let db = null;
    try 
    {
        if (!req.params.voucherNo)
        {
          return res.status(400).send({Id:-155,VoucherNo:'Voucherno is required.'});
        }
      
        let voucherNo = req.params.voucherNo;
        db = new Database(connectionString)
            
        let ErrMsg = {"Error":""};
        let bReturnValue = await deleteTransaction(db,voucherNo,ErrMsg);
         
        if (!bReturnValue)
        {
             // con sole.log(ErrMsg);
              res.status(200).send({Id:-155,errMsg:ErrMsg.Error}); 
        }
        else 
            res.status(200).send({Id:0,errMsg:"Success."});
      }
      catch (err) 
      {
        //con sole.error(err);
        res.status(500).send({Id:-155,errMsg:'Edit voucher:Server Error.'});
      }
      finally 
      {
        db?.close();
      }
  });
app.get('/api/data/report/generalledger/:fromDate/:toDate/:accountGroup/:accountName', async (req, res) => {
  let db = null;
  try 
  {
     if (!req.params.fromDate)
      {
        return res.status(400).send({Id:-155,Name:'From Date is required.',arabic_Name:"",type:-100,levelNo:0,level1:0,level2:0,level3:0,level4:0,level5:0,level6:0,level7:0,level8:0});
      }
      let fromDate = req.params.fromDate;
      if (!req.params.toDate)
      {
        return res.status(400).send({Id:-155,Name:'To Date is required.',arabic_Name:"",type:-100,levelNo:0,level1:0,level2:0,level3:0,level4:0,level5:0,level6:0,level7:0,level8:0});
      }
      let toDate = req.params.toDate;
      let accountGroup = "";
      if (req.params.accountGroup)
      {
        accountGroup = req.params.accountGroup;
      }
      let accountName = "";
      if (req.params.accountName)
      {
        accountName = req.params.accountName;
      }
      let sStmtDr =  "";
      let sStmtCr =  "";
      
      let sStmtOPDr =  "";
      let sStmtOPCr =  "";
      
      let sAccountDrFilter =  "";
      let sAccountCrFilter =  "";

     let  enOpAccount = -500;
     let  enOpAccountNo = -500;
      if((accountGroup === '') || (accountGroup.toLowerCase() === "all"))
      {
        sAccountDrFilter ="";
        sAccountCrFilter = "";
      }
      else
      {
        if((accountName === '') || (accountName.toLowerCase() === "all"))
        {
          sAccountDrFilter = ` And (MastDr.ParentName ='${accountGroup}') `;
          sAccountCrFilter = ` And (MastCr.ParentName ='${accountGroup}')`;
        }
        else
        {
          sAccountDrFilter = ` And (MastDr.Name ='${accountName}') `;
          sAccountCrFilter = ` And (MastCr.Name ='${accountName}')`;
        }
      }
      ///con sole.log("accr  filter =",sAccountCrFilter);
      sStmtOPDr = `Select  'a' as VCode,MastDr.Id As Account1_No,'' As VoucherNo,Sum(Amount) As Amt,${enOpAccountNo} As Account2_No,'1-jan-1998' As VoucherDate,'' As Narration,'' As  LNarration,'' As  ChequeNo From FAccounting FACC,Mast1 MastDr Where (MastDr.ID > 0) And (MastDr.ID = FACC.AccountDr)  ${sAccountDrFilter} And ((FACC.VoucherDate < ${GetDateFilter(fromDate,true)}) Or (AccountCr =${enOpAccount})) Group By MastDr.Id`;
	    sStmtOPCr = `Select  'b' as VCode,MastCr.Id As Account1_No,'' As VoucherNo,-Sum(Amount) As Amt,${enOpAccountNo} As Account2_No,'1-jan-1998' As VoucherDate,'' As Narration,'' As  LNarration,'' As  ChequeNo From FAccounting FACC,Mast1 MastCr Where (MastCr.ID > 0) And  (MastCr.ID = FACC.AccountCr)  ${sAccountCrFilter} And ((FACC.VoucherDate < ${GetDateFilter(fromDate,true)}) Or (AccountDr = ${enOpAccount})) Group By MastCr.Id`;

	    let sOpStmt = `${sStmtOPDr} Union All ${sStmtOPCr} `;

      //con sole.log(sOpStmt);
      sStmtDr = `Select 'c' as VCode,FAInner.AccountDr As Account1_No,VoucherNo  As VNo,Sum(FAInner.Amount) As Amt ,AccountCr As Account2_No,Max(VoucherDate) As  VDate,Max(Narration) As  Narr,Max(LNarration) As  LNarr,Max(ChequeNo) as ChkNo From FAccounting FAInner,Mast1 MastDr Where (MastDr.ID > 0) And (MastDr.ID = FAInner.AccountDr) ${sAccountDrFilter} And ((FAInner.VoucherDate >= ${GetDateFilter(fromDate,true)}) And (FAInner.VoucherDate <=  ${GetDateFilter(toDate,false)})) And (FAInner.AccountCr <> ${enOpAccount}) Group By FAInner.AccountDr,FAInner.VoucherNo,FAInner.AccountCr`;
	    sStmtCr = `Select 'd' as VCode,FAInner.AccountCr  As Account1_No,FAInner.VoucherNo  VNo,-Sum(FAInner.Amount)  As Amt,AccountDr As Account2_No ,Max(VoucherDate) As VDate,Max(Narration) As  Narr,Max(LNarration) As  LNarr,Max(ChequeNo) as ChkNo From FAccounting FAInner,Mast1 MastDr Where (MastDr.ID > 0) And  (MastDr.ID = FAInner.AccountCr) ${sAccountDrFilter} And ((FAInner.VoucherDate >= ${GetDateFilter(fromDate,true)}) And (FAInner.VoucherDate <= ${GetDateFilter(toDate,false)})) And (FAInner.AccountDr <> ${enOpAccount}) Group By FAInner.AccountCr,FAInner.VoucherNo,FAInner.AccountDr`;
	
	    let sStmt = `Select Vcode,Account1_No ,VNo As VoucherNo,Sum(Amt) As Amount,Max(Account2_No) As Account2_No,Max(VDate) As VoucherDate,Max(Narr) as Narration,Max(LNarr) as LNarration,Max(ChkNo) as ChequeNo From (${sStmtDr} Union All ${sStmtCr} Union All ${sStmtOPDr} Union All ${sStmtOPCr}) FAOuter Group By FAOuter.Account1_No,FAOuter.Account2_No,FAOuter.VNo `;


	    let sStmtFinal = `Select ROW_NUMBER() OVER (ORDER BY MastDr.Name,VoucherDate,VoucherNo) AS RowNo,Account1_No,Account2_No,VoucherNo,STRFTIME('%d/%m/%Y', VoucherDate) VoucherDate,Amount,Narration,LNarration,MastDr.Name as Account1_Name,MastCr.Name as Account2_Name,ChequeNo from (${sStmt}) FAFinal,Mast1 MastDr,Mast1 MastCr Where (MastDr.Id =  FAFinal.Account1_No) And  (MastCr.Id =  FAFinal.Account2_No)   order by MastDr.Name,VoucherDate,VCode,VoucherNo`;

        //con sole.log("stmt dr " + sStmtDr);
        //con sole.log("stmt cr "+sStmtCr);
        //con sole.log(sStmtFinal);
       
    
  ///
   db = new Database(connectionString)
     

    db.all(sStmtFinal, (err, rows) => 
    {
        if (err) 
        {
          console.log("unable to fetch data.");
          throw err;
        }
    let count = 0
    res.json(rows);
  });
  
  
  return;
///
	

    ///if (result.rowsAffected <= 0)
   /// {
     // res.status(200).send({NodeNo:-155,Name:`${masterName} not found.`,Code_Name:"",Tenant:"",Email:"",PhoneNo:"",AcType:"",ParentName:"",Address1:"",Address2:"",Address3:""});
     
   /// }
    //res.json(result.recordset);
   /// return;
} 
catch (err)
{
    ///con sole.error(err);
    res.status(500).send({Id:-155,Name:'Get General Ledger:Server Error.'+err.message});
}
finally 
{
    db?.close();
}
});
// set PORT=5000 && node apartment // cmdline to run on port 5000
const PORT = process.env.PORT || 3000;
/*const https = require('https');
const fs = require('fs');
const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};
const server = https.createServer(options, app);*/
app.listen(PORT, () =>
 {
  console.log(`Server is running on port ${PORT}`);
});
// 

/*app.post('/api/data/account/edit', async (req, res) =>
{
    try {
      
      if (!req.body.name)
         return res.status(400).send({id:-155,name:'name is required'});

      let name = req.body.name;
      console.log('this is new hereo ',name);
      let  pool = await  sql.connect(config);
      let found = await pool.request().query(`SELECT  *  FROM Tour_Of_Heroes where name ='${name}'`);

      if (found.recordset.length> 0)
      {
        res.status(400).send({id:-155,name:'duplicate name '});
        return;
      }
      found = await pool.request().query('SELECT  max(id)  as Maxid  FROM Tour_Of_Heroes');
      let newId = 0;
      if (found.recordset.length> 0)
      {
        newId = found.recordset[0].Maxid;
      }
      newId++;
      let sqlQuery = `Insert Into Tour_Of_Heroes Values(${newId},'${name}')`;
      let result = await pool.request().query(sqlQuery);
      if (result <= 0)
      {
        res.status(400).send({id:-155,name:'cannot add data '});
         return;
      }
      res.status(200).send({id:newId,name:name});
    }
    catch (err) {
      console.error(err);
      res.status(500).send({id:-155,name:'Server Error'});
    }
  });*/
/*
const sqli te3 = require('sqli te3').verbose();

// Open a database connection
const db = new sqli te3.Database('./mydatabase.db', (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the SQLite database.');
});

// Create a table if it doesn't exist
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL
  )`);
db.run(`INSERT INTO users (name, email) VALUES (?, ?)`, ['Alice', 'alice@example.com'], function(err) {
    if (err) {
      return console.log(err.message);
    }
    console.log(`A row has been inserted with rowid ${this.lastID}`);
  });

  db.run(`INSERT INTO users (name, email) VALUES (?, ?)`, ['Bob', 'bob@example.com'], function(err) {
    if (err) {
      return console.log(err.message);
    }
    console.log(`A row has been inserted with rowid ${this.lastID}`);
  });

  // UPDATE operation
  db.run(`UPDATE users SET name = ? WHERE email = ?`, ['Alicia', 'alice@example.com'], function(err) {
    if (err) {
      return console.log(err.message);
    }
    console.log(`Row(s) updated: ${this.changes}`);
  });

  // DELETE operation
  db.run(`DELETE FROM users WHERE email = ?`, ['bob@example.com'], function(err) {
    if (err) {
      return console.log(err.message);
    }
    console.log(`Row(s) deleted: ${this.changes}`);
  });
   db.serialize(() => {
  db.run("CREATE TABLE accounts (id INTEGER PRIMARY KEY, name TEXT, balance REAL)");
  db.run("INSERT INTO accounts (name, balance) VALUES (?, ?)", ['Alice', 1000]);
  db.run("INSERT INTO accounts (name, balance) VALUES (?, ?)", ['Bob', 500]);
});
*/
/*async function getRowsFromDb() {
  const db = await open({
    filename: ':memory:',
    driver: sqli te3.Database
  });

  try {
    await db.exec("CREATE TABLE users (id INT, name TEXT)");
    await db.exec("INSERT INTO users VALUES (1, 'Alice')");
    
    // The `await` keyword pauses the async function, but not the event loop
    console.log("Starting async query...");
    const rows = await db.all("SELECT * FROM users");
    console.log("Async query finished. Rows:", rows);

  } catch (err) {
    console.error(err.message);
  } finally {
    db.close();
  }
}*/